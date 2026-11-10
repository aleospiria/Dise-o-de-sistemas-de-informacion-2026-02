from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import bad_request, conflict, not_found
from app.domain.enums import LoanStatus, ResourceStatus
from app.domain.state_machine import is_valid_transition
from app.domain.validators import ensure_aware, now_utc
from app.models import Loan, Resource, ResourceStatusHistory
from app.schemas.resource import ResourceCreateRequest, ResourceUpdateRequest
from app.services.notification_service import notify_resource_available

ACTIVE_LOAN_STATUSES = (LoanStatus.RESERVADO, LoanStatus.EN_PRESTAMO)


def _overlap_subquery(start: datetime, end: datetime):
    return (
        select(func.count(Loan.id))
        .where(
            Loan.resource_id == Resource.id,
            Loan.estado_prestamo.in_(ACTIVE_LOAN_STATUSES),
            Loan.fecha_hora_inicio_programada < end,
            Loan.fecha_hora_fin_programada > start,
        )
        .correlate(Resource)
        .scalar_subquery()
    )


def count_overlapping(db: Session, resource_id: str, start: datetime, end: datetime) -> int:
    return int(
        db.scalar(
            select(func.count(Loan.id)).where(
                Loan.resource_id == resource_id,
                Loan.estado_prestamo.in_(ACTIVE_LOAN_STATUSES),
                Loan.fecha_hora_inicio_programada < ensure_aware(end),
                Loan.fecha_hora_fin_programada > ensure_aware(start),
            )
        )
        or 0
    )


def count_active_loans(db: Session, resource_id: str) -> int:
    return int(
        db.scalar(
            select(func.count(Loan.id)).where(
                Loan.resource_id == resource_id,
                Loan.estado_prestamo.in_(ACTIVE_LOAN_STATUSES),
            )
        )
        or 0
    )


def get_resource(db: Session, resource_id: str) -> Resource:
    resource = db.get(Resource, resource_id)
    if resource is None:
        raise not_found("Recurso")
    return resource


def list_resources(
    db: Session,
    nombre: str | None = None,
    tipo: str | None = None,
    estado: str | None = None,
    incluir_baja: bool = False,
) -> list[Resource]:
    statement = select(Resource)
    if not incluir_baja:
        statement = statement.where(Resource.estado_actual != ResourceStatus.DADO_DE_BAJA)
    if nombre:
        statement = statement.where(Resource.nombre.ilike(f"%{nombre.strip()}%"))
    if tipo:
        statement = statement.where(Resource.tipo == tipo)
    if estado:
        statement = statement.where(Resource.estado_actual == estado)
    statement = statement.order_by(func.lower(Resource.nombre))
    return list(db.scalars(statement).all())


def create_resource(db: Session, data: ResourceCreateRequest) -> Resource:
    duplicate = db.scalar(
        select(Resource).where(
            func.lower(Resource.codigo_inventario) == data.codigo_inventario.strip().lower()
        )
    )
    if duplicate is not None:
        raise conflict("Ya existe un recurso con ese código de inventario.")
    resource = Resource(
        nombre=data.nombre.strip(),
        codigo_inventario=data.codigo_inventario.strip(),
        tipo=data.tipo,
        descripcion=data.descripcion.strip(),
        imagen_url=data.imagen_url,
        cantidad_total=data.cantidad_total,
        cantidad_disponible=data.cantidad_total,
        estado_actual=ResourceStatus.DISPONIBLE,
    )
    db.add(resource)
    db.flush()
    db.add(
        ResourceStatusHistory(
            resource_id=resource.id,
            estado=ResourceStatus.DISPONIBLE,
            motivo="Registro inicial del recurso.",
        )
    )
    db.flush()
    return resource


def update_resource(db: Session, resource_id: str, data: ResourceUpdateRequest) -> Resource:
    resource = get_resource(db, resource_id)
    if resource.estado_actual == ResourceStatus.DADO_DE_BAJA:
        raise bad_request("Un recurso dado de baja no se puede editar.")

    changes = data.model_dump(exclude_unset=True)
    if "codigo_inventario" in changes and changes["codigo_inventario"] is not None:
        new_code = changes["codigo_inventario"].strip()
        duplicate = db.scalar(
            select(Resource).where(
                func.lower(Resource.codigo_inventario) == new_code.lower(),
                Resource.id != resource.id,
            )
        )
        if duplicate is not None:
            raise conflict("Ya existe un recurso con ese código de inventario.")
        changes["codigo_inventario"] = new_code
    if "nombre" in changes and changes["nombre"] is not None:
        changes["nombre"] = changes["nombre"].strip()
    if "descripcion" in changes and changes["descripcion"] is not None:
        changes["descripcion"] = changes["descripcion"].strip()

    en_uso = resource.cantidad_total - resource.cantidad_disponible
    if "cantidad_total" in changes and changes["cantidad_total"] is not None:
        if changes["cantidad_total"] < en_uso:
            raise bad_request(
                f"No puedes reducir la cantidad a {changes['cantidad_total']}: "
                f"hay {en_uso} unidades en uso."
            )
        resource.cantidad_total = changes.pop("cantidad_total")
        resource.cantidad_disponible = resource.cantidad_total - en_uso
    for field, value in changes.items():
        setattr(resource, field, value)

    _reconcile_stock_state(db, resource)
    db.flush()
    return resource


def _reconcile_stock_state(db: Session, resource: Resource) -> None:
    if resource.cantidad_disponible > 0 and resource.estado_actual in (
        ResourceStatus.RESERVADO,
        ResourceStatus.EN_PRESTAMO,
    ):
        _set_status(
            db,
            resource,
            ResourceStatus.DISPONIBLE,
            "Se agregaron unidades al inventario.",
        )
    elif resource.cantidad_disponible == 0 and resource.estado_actual == ResourceStatus.DISPONIBLE:
        _set_status(db, resource, ResourceStatus.RESERVADO, "Sin unidades libres.")


def _set_status(
    db: Session,
    resource: Resource,
    new_status: ResourceStatus,
    motivo: str | None,
) -> Resource:
    if resource.estado_actual == new_status:
        return resource
    if not is_valid_transition(resource.estado_actual, new_status):
        raise bad_request(
            f"Transición de estado inválida: {resource.estado_actual} → {new_status}."
        )
    resource.estado_actual = new_status
    db.add(
        ResourceStatusHistory(
            resource_id=resource.id,
            estado=new_status,
            motivo=motivo,
        )
    )
    db.flush()
    if new_status == ResourceStatus.DISPONIBLE:
        notify_resource_available(db, resource)
    return resource


def update_status(
    db: Session,
    resource_id: str,
    new_status: ResourceStatus,
    motivo: str | None,
) -> Resource:
    resource = get_resource(db, resource_id)
    if new_status == ResourceStatus.DADO_DE_BAJA and count_active_loans(db, resource.id) > 0:
        raise conflict("No se puede dar de baja: el recurso tiene préstamos activos.")
    return _set_status(db, resource, new_status, motivo)


def adjust_available_quantity(db: Session, resource: Resource, delta: int) -> Resource:
    resource.cantidad_disponible = max(
        0,
        min(resource.cantidad_total, resource.cantidad_disponible + delta),
    )
    db.flush()
    return resource


def retire_resource(db: Session, resource_id: str) -> Resource:
    resource = get_resource(db, resource_id)
    if count_active_loans(db, resource.id) > 0:
        raise conflict("No se puede dar de baja: el recurso tiene préstamos activos.")
    return _set_status(
        db,
        resource,
        ResourceStatus.DADO_DE_BAJA,
        "Dado de baja por administrador.",
    )


def get_history(db: Session, resource_id: str) -> list[ResourceStatusHistory]:
    get_resource(db, resource_id)
    return list(
        db.scalars(
            select(ResourceStatusHistory)
            .where(ResourceStatusHistory.resource_id == resource_id)
            .order_by(ResourceStatusHistory.fecha_cambio.desc())
        ).all()
    )


def is_bookable(resource: Resource) -> bool:
    return resource.estado_actual == ResourceStatus.DISPONIBLE and resource.cantidad_disponible > 0


def check_availability(
    db: Session,
    resource_id: str,
    start: datetime,
    end: datetime,
) -> bool:
    resource = db.get(Resource, resource_id)
    if resource is None or not is_bookable(resource):
        return False
    return count_overlapping(db, resource_id, start, end) < resource.cantidad_total


def list_available(
    db: Session,
    start: datetime,
    end: datetime,
    nombre: str | None = None,
    tipo: str | None = None,
) -> list[Resource]:
    start = ensure_aware(start)
    end = ensure_aware(end)
    if end <= start:
        raise bad_request("La fecha de fin debe ser posterior a la fecha de inicio.")
    overlap = _overlap_subquery(start, end)
    statement = select(Resource).where(
        Resource.estado_actual == ResourceStatus.DISPONIBLE,
        Resource.cantidad_disponible > 0,
        overlap < Resource.cantidad_total,
    )
    if nombre:
        statement = statement.where(Resource.nombre.ilike(f"%{nombre.strip()}%"))
    if tipo:
        statement = statement.where(Resource.tipo == tipo)
    statement = statement.order_by(func.lower(Resource.nombre))
    return list(db.scalars(statement).all())


def next_availability(db: Session, resource: Resource) -> datetime | None:
    if is_bookable(resource):
        return now_utc()
    next_end = db.scalar(
        select(func.min(Loan.fecha_hora_fin_programada)).where(
            Loan.resource_id == resource.id,
            Loan.estado_prestamo.in_(ACTIVE_LOAN_STATUSES),
            Loan.fecha_hora_fin_programada > now_utc(),
        )
    )
    return next_end
