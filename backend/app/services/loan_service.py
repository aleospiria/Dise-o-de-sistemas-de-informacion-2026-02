from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import bad_request, conflict, forbidden, not_found
from app.domain.enums import LoanStatus, ResourceCondition, ResourceStatus, UserRole
from app.domain.state_machine import RETURN_CONDITION_STRATEGY
from app.domain.validators import (
    calculate_delay_hours,
    ensure_aware,
    now_utc,
    validate_loan_times,
    validate_observaciones,
)
from app.models import Loan, LoanSeries, User
from app.schemas.loan import (
    DeliveryRequest,
    LoanCreateRequest,
    RecurringLoanRequest,
    ReturnRequest,
)
from app.services import resource_service
from app.services.notification_service import mark_resource_notifications_read
from app.services.sanction_service import apply_sanction_for_loan, get_active_sanction

MIN_CANCEL_HOURS = 2


def get_loan(db: Session, loan_id: str) -> Loan:
    loan = db.get(Loan, loan_id)
    if loan is None:
        raise not_found("Préstamo")
    return loan


def _ensure_can_view(loan: Loan, user: User) -> None:
    if user.role == UserRole.ESTUDIANTE and loan.user_id != user.id:
        raise forbidden("No puedes acceder a préstamos de otro usuario.")


def _ensure_no_active_sanction(db: Session, user: User) -> None:
    sanction = get_active_sanction(db, user.id)
    if sanction is not None:
        raise forbidden(
            "Tienes una sanción activa hasta "
            f"{sanction.fecha_fin.isoformat()}. No puedes crear préstamos."
        )


def create_loan(db: Session, user: User, data: LoanCreateRequest) -> Loan:
    _ensure_no_active_sanction(db, user)
    error = validate_loan_times(data.fecha_hora_inicio_programada, data.fecha_hora_fin_programada)
    if error:
        raise bad_request(error)
    resource = resource_service.get_resource(db, data.id_recurso)
    if not resource_service.check_availability(
        db,
        resource.id,
        data.fecha_hora_inicio_programada,
        data.fecha_hora_fin_programada,
    ):
        raise conflict("El recurso no está disponible en el horario seleccionado.")

    loan = Loan(
        user_id=user.id,
        resource_id=resource.id,
        fecha_hora_inicio_programada=data.fecha_hora_inicio_programada,
        fecha_hora_fin_programada=data.fecha_hora_fin_programada,
        estado_prestamo=LoanStatus.RESERVADO,
        motivo_prestamo=data.motivo_prestamo.strip(),
    )
    db.add(loan)
    db.flush()
    resource_service.adjust_available_quantity(db, resource, -1)
    if resource.cantidad_disponible == 0 and resource.estado_actual == ResourceStatus.DISPONIBLE:
        resource_service._set_status(
            db,
            resource,
            ResourceStatus.RESERVADO,
            "Stock agotado por reservas.",
        )
    mark_resource_notifications_read(db, user, resource.id)
    return loan


def get_loans_by_user(db: Session, user_id: str) -> list[Loan]:
    return list(
        db.scalars(
            select(Loan)
            .where(Loan.user_id == user_id)
            .order_by(Loan.fecha_hora_inicio_programada.desc())
        ).all()
    )


def list_loans(
    db: Session,
    user_id: str | None = None,
    resource_id: str | None = None,
    estado: LoanStatus | None = None,
    fecha_inicio: datetime | None = None,
    fecha_fin: datetime | None = None,
) -> list[Loan]:
    statement = select(Loan)
    if user_id:
        statement = statement.where(Loan.user_id == user_id)
    if resource_id:
        statement = statement.where(Loan.resource_id == resource_id)
    if estado is not None:
        statement = statement.where(Loan.estado_prestamo == estado)
    if fecha_inicio is not None:
        statement = statement.where(Loan.fecha_hora_inicio_programada >= ensure_aware(fecha_inicio))
    if fecha_fin is not None:
        statement = statement.where(Loan.fecha_hora_inicio_programada <= ensure_aware(fecha_fin))
    statement = statement.order_by(Loan.fecha_hora_inicio_programada.desc())
    return list(db.scalars(statement).all())


def get_pending_deliveries(db: Session) -> list[Loan]:
    return list(
        db.scalars(
            select(Loan)
            .where(
                Loan.estado_prestamo == LoanStatus.RESERVADO,
                Loan.fecha_hora_inicio_programada <= now_utc(),
            )
            .order_by(Loan.fecha_hora_inicio_programada.asc())
        ).all()
    )


def get_pending_returns(db: Session) -> list[Loan]:
    return list(
        db.scalars(
            select(Loan)
            .where(Loan.estado_prestamo == LoanStatus.EN_PRESTAMO)
            .order_by(Loan.fecha_hora_fin_programada.asc())
        ).all()
    )


def register_delivery(db: Session, loan_id: str, data: DeliveryRequest) -> Loan:
    loan = get_loan(db, loan_id)
    if loan.estado_prestamo != LoanStatus.RESERVADO:
        raise bad_request("Solo se pueden entregar préstamos reservados.")
    observaciones = (data.observaciones or "").strip()
    if not validate_observaciones(observaciones):
        raise bad_request("Las observaciones no pueden superar 500 caracteres.")
    if data.condicion == ResourceCondition.DANADO and not observaciones:
        raise bad_request("Las observaciones son obligatorias si el recurso está dañado.")

    loan.estado_prestamo = LoanStatus.EN_PRESTAMO
    loan.fecha_hora_entrega = now_utc()
    loan.condicion_entrega = data.condicion
    loan.observaciones_entrega = observaciones or None
    db.flush()

    resource = resource_service.get_resource(db, loan.resource_id)
    other_pending = db.scalar(
        select(Loan.id).where(
            Loan.resource_id == loan.resource_id,
            Loan.id != loan.id,
            Loan.estado_prestamo == LoanStatus.RESERVADO,
        )
    )
    if resource.estado_actual == ResourceStatus.RESERVADO and other_pending is None:
        resource_service._set_status(
            db,
            resource,
            ResourceStatus.EN_PRESTAMO,
            "Entrega registrada.",
        )
    return loan


def register_return(db: Session, loan_id: str, data: ReturnRequest) -> Loan:
    loan = get_loan(db, loan_id)
    if loan.estado_prestamo != LoanStatus.EN_PRESTAMO:
        raise bad_request("Solo se pueden devolver préstamos en curso.")
    observaciones = (data.observaciones or "").strip()
    if not validate_observaciones(observaciones):
        raise bad_request("Las observaciones no pueden superar 500 caracteres.")

    now = now_utc()
    retraso = calculate_delay_hours(now, loan.fecha_hora_fin_programada)
    loan.estado_prestamo = LoanStatus.DEVUELTO
    loan.fecha_hora_devolucion_real = now
    loan.condicion_devolucion = data.condicion
    loan.observaciones_devolucion = observaciones or None
    loan.retraso_horas = retraso
    db.flush()

    resource = resource_service.get_resource(db, loan.resource_id)
    resource_service.adjust_available_quantity(db, resource, 1)
    if resource.estado_actual not in (
        ResourceStatus.EN_MANTENIMIENTO,
        ResourceStatus.DADO_DE_BAJA,
    ):
        new_status = RETURN_CONDITION_STRATEGY[data.condicion]
        if new_status != resource.estado_actual:
            resource_service._set_status(
                db,
                resource,
                new_status,
                "Devolución registrada.",
            )
    apply_sanction_for_loan(db, loan, retraso)
    return loan


def _cancel_single(db: Session, loan: Loan, now: datetime) -> None:
    loan.estado_prestamo = LoanStatus.CANCELADO
    loan.fecha_hora_cancelacion = now
    db.flush()
    resource = resource_service.get_resource(db, loan.resource_id)
    resource_service.adjust_available_quantity(db, resource, 1)
    if resource.estado_actual == ResourceStatus.RESERVADO and resource.cantidad_disponible > 0:
        resource_service._set_status(
            db,
            resource,
            ResourceStatus.DISPONIBLE,
            "Reserva cancelada.",
        )


def cancel_loan(
    db: Session,
    user: User,
    loan_id: str,
    cancelar_serie: bool = False,
) -> list[Loan]:
    loan = get_loan(db, loan_id)
    if user.role == UserRole.ESTUDIANTE and loan.user_id != user.id:
        raise forbidden("No puedes cancelar préstamos de otro usuario.")
    now = now_utc()
    if loan.estado_prestamo != LoanStatus.RESERVADO:
        raise bad_request("Solo se pueden cancelar préstamos reservados.")
    if loan.fecha_hora_inicio_programada - now < timedelta(hours=MIN_CANCEL_HOURS):
        raise bad_request("Solo puedes cancelar una reserva hasta 2 horas antes de su inicio.")

    if cancelar_serie and loan.series_id:
        loans = list(
            db.scalars(
                select(Loan).where(
                    Loan.series_id == loan.series_id,
                    Loan.estado_prestamo == LoanStatus.RESERVADO,
                )
            ).all()
        )
        too_late = [
            item.id
            for item in loans
            if item.fecha_hora_inicio_programada - now < timedelta(hours=MIN_CANCEL_HOURS)
        ]
        if too_late:
            raise conflict(
                "Algunas ocurrencias de la serie están a menos de 2 horas de iniciar.",
                details=too_late,
            )
        for item in loans:
            _cancel_single(db, item, now)
        return loans

    _cancel_single(db, loan, now)
    return [loan]


def _js_weekday(value: date) -> int:
    return (value.weekday() + 1) % 7


def _combine(day: date, clock: time) -> datetime:
    return datetime.combine(day, clock, tzinfo=UTC)


def create_recurring_loans(
    db: Session,
    user: User,
    data: RecurringLoanRequest,
) -> tuple[LoanSeries, list[Loan], list[datetime], list[datetime]]:
    _ensure_no_active_sanction(db, user)
    resource = resource_service.get_resource(db, data.id_recurso)
    if not resource_service.is_bookable(resource):
        raise conflict("El recurso no está disponible en el horario seleccionado.")

    occurrences: list[tuple[datetime, datetime]] = []
    conflicts: list[datetime] = []
    current = data.fecha_inicio
    while current <= data.fecha_fin:
        if _js_weekday(current) in data.dias_semana:
            start = _combine(current, data.hora_inicio)
            end = _combine(current, data.hora_fin)
            error = validate_loan_times(start, end)
            if error:
                raise bad_request(f"{error} (ocurrencia {current.isoformat()})")
            if resource_service.count_overlapping(db, resource.id, start, end) >= (
                resource.cantidad_total
            ):
                conflicts.append(start)
            else:
                occurrences.append((start, end))
        current += timedelta(days=1)

    if not occurrences and not conflicts:
        raise bad_request("El patrón de recurrencia no genera ninguna ocurrencia.")
    if conflicts and not data.crear_solo_disponibles:
        raise conflict(
            "Algunas ocurrencias no están disponibles en el horario seleccionado.",
            details=[value.isoformat() for value in conflicts],
        )
    if not occurrences:
        raise conflict(
            "Ninguna ocurrencia está disponible en el horario seleccionado.",
            details=[value.isoformat() for value in conflicts],
        )

    series = LoanSeries(
        user_id=user.id,
        resource_id=resource.id,
        dias_semana=data.dias_semana,
        hora_inicio=data.hora_inicio,
        hora_fin=data.hora_fin,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        motivo_prestamo=data.motivo_prestamo.strip(),
    )
    db.add(series)
    db.flush()

    loans: list[Loan] = []
    for start, end in occurrences:
        loan = Loan(
            user_id=user.id,
            resource_id=resource.id,
            series_id=series.id,
            fecha_hora_inicio_programada=start,
            fecha_hora_fin_programada=end,
            estado_prestamo=LoanStatus.RESERVADO,
            motivo_prestamo=data.motivo_prestamo.strip(),
        )
        db.add(loan)
        db.flush()
        loans.append(loan)
        resource_service.adjust_available_quantity(db, resource, -1)

    if resource.cantidad_disponible == 0 and resource.estado_actual == ResourceStatus.DISPONIBLE:
        resource_service._set_status(
            db,
            resource,
            ResourceStatus.RESERVADO,
            "Stock agotado por reservas recurrentes.",
        )
    mark_resource_notifications_read(db, user, resource.id)
    omitted = conflicts if data.crear_solo_disponibles else []
    return series, loans, conflicts, omitted


def get_series(db: Session, series_id: str, user: User) -> LoanSeries:
    series = db.get(LoanSeries, series_id)
    if series is None:
        raise not_found("Serie de reservas")
    if user.role == UserRole.ESTUDIANTE and series.user_id != user.id:
        raise forbidden("No puedes acceder a series de otro usuario.")
    return series
