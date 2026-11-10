from __future__ import annotations

import csv
import io
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import bad_request
from app.domain.enums import ResourceStatus, ResourceType
from app.domain.validators import validate_quantity, validate_resource_name
from app.models import Resource, ResourceStatusHistory
from app.schemas.resource import (
    ResourceImportError,
    ResourceImportResult,
    ResourceImportRow,
)

EXPORT_COLUMNS = [
    "id_recurso",
    "nombre",
    "codigo_inventario",
    "tipo",
    "descripcion",
    "imagen_url",
    "cantidad_total",
    "cantidad_disponible",
    "estado_actual",
    "fecha_creacion",
]

REQUIRED_COLUMNS = {
    "nombre",
    "codigo_inventario",
    "tipo",
    "cantidad_total",
    "cantidad_disponible",
}


def export_resources_csv(db: Session) -> str:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=EXPORT_COLUMNS)
    writer.writeheader()
    resources = db.scalars(select(Resource).order_by(Resource.nombre)).all()
    for resource in resources:
        writer.writerow(
            {
                "id_recurso": resource.id,
                "nombre": resource.nombre,
                "codigo_inventario": resource.codigo_inventario,
                "tipo": resource.tipo.value,
                "descripcion": resource.descripcion,
                "imagen_url": resource.imagen_url or "",
                "cantidad_total": resource.cantidad_total,
                "cantidad_disponible": resource.cantidad_disponible,
                "estado_actual": resource.estado_actual.value,
                "fecha_creacion": resource.fecha_creacion.isoformat(),
            }
        )
    return buffer.getvalue()


def _parse_status(raw: str) -> ResourceStatus:
    normalized = raw.strip().lower().replace(" ", "_")
    for status in ResourceStatus:
        if normalized in (status.value.lower(), status.name.lower()):
            return status
    raise ValueError(f"Estado desconocido: {raw}")


def _parse_type(raw: str) -> ResourceType:
    normalized = raw.strip().lower().replace(" ", "_")
    for resource_type in ResourceType:
        if normalized in (resource_type.value.lower(), resource_type.name.lower()):
            return resource_type
    raise ValueError(f"Tipo desconocido: {raw}")


def _parse_int(raw: str, field: str) -> int:
    try:
        return int(str(raw).strip())
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field} debe ser un número entero.") from exc


def _row_value(row: dict[str, Any], *names: str) -> str:
    for name in names:
        value = row.get(name)
        if value is not None and str(value).strip() != "":
            return str(value).strip()
    return ""


def _parse_rows(
    content: str,
) -> tuple[list[ResourceImportRow], list[ResourceImportError]]:
    reader = csv.DictReader(io.StringIO(content))
    if reader.fieldnames is None:
        raise bad_request("El archivo CSV está vacío o no tiene encabezados.")
    normalized_fields = {field.strip(): field for field in reader.fieldnames if field}
    missing = REQUIRED_COLUMNS - set(normalized_fields)
    if missing:
        raise bad_request(
            "Faltan columnas obligatorias en el CSV.",
            details=sorted(missing),
        )

    rows: list[ResourceImportRow] = []
    errors: list[ResourceImportError] = []
    for index, raw_row in enumerate(reader, start=2):
        row = {key.strip(): value for key, value in raw_row.items() if key}
        try:
            nombre = _row_value(row, "nombre")
            codigo = _row_value(row, "codigo_inventario")
            if not validate_resource_name(nombre):
                raise ValueError("El nombre es obligatorio y no debe superar 100 caracteres.")
            if not codigo or len(codigo) > 50:
                raise ValueError("El código de inventario es obligatorio (máx. 50 caracteres).")
            tipo = _parse_type(_row_value(row, "tipo"))
            estado_raw = (
                _row_value(row, "estado_actual", "estado") or ResourceStatus.DISPONIBLE.value
            )
            estado = _parse_status(estado_raw)
            total = _parse_int(_row_value(row, "cantidad_total"), "cantidad_total")
            disponible = _parse_int(
                _row_value(row, "cantidad_disponible"),
                "cantidad_disponible",
            )
            if not validate_quantity(total):
                raise ValueError("cantidad_total debe ser mayor que 0.")
            if disponible < 0 or disponible > total:
                raise ValueError("cantidad_disponible debe estar entre 0 y cantidad_total.")
            descripcion = _row_value(row, "descripcion")
            if len(descripcion) > 2000:
                raise ValueError("La descripción no puede superar 2000 caracteres.")
            rows.append(
                ResourceImportRow(
                    fila=index,
                    id_recurso=_row_value(row, "id_recurso", "id") or None,
                    nombre=nombre,
                    codigo_inventario=codigo,
                    tipo=tipo,
                    descripcion=descripcion,
                    imagen_url=_row_value(row, "imagen_url") or None,
                    cantidad_total=total,
                    cantidad_disponible=disponible,
                    estado_actual=estado,
                )
            )
        except ValueError as exc:
            errors.append(ResourceImportError(fila=index, error=str(exc)))
    return rows, errors


def _find_existing(db: Session, row: ResourceImportRow) -> Resource | None:
    if row.id_recurso:
        resource = db.get(Resource, row.id_recurso)
        if resource is not None:
            return resource
    return db.scalar(
        select(Resource).where(
            func.lower(Resource.codigo_inventario) == row.codigo_inventario.lower()
        )
    )


def import_resources(db: Session, content: str, confirm: bool) -> ResourceImportResult:
    rows, errors = _parse_rows(content)
    total = len(rows) + len(errors)
    if errors and confirm:
        raise bad_request(
            "El archivo contiene filas inválidas. Corrige los errores antes de confirmar.",
            details=[error.model_dump() for error in errors],
        )
    if not confirm:
        return ResourceImportResult(
            confirmado=False,
            total_filas=total,
            filas_validas=len(rows),
            filas=rows,
            errores=errors,
        )

    creados = 0
    actualizados = 0
    for row in rows:
        existing = _find_existing(db, row)
        if existing is None:
            resource = Resource(
                nombre=row.nombre,
                codigo_inventario=row.codigo_inventario,
                tipo=row.tipo,
                descripcion=row.descripcion,
                imagen_url=row.imagen_url,
                cantidad_total=row.cantidad_total,
                cantidad_disponible=row.cantidad_disponible,
                estado_actual=row.estado_actual,
            )
            db.add(resource)
            db.flush()
            db.add(
                ResourceStatusHistory(
                    resource_id=resource.id,
                    estado=row.estado_actual,
                    motivo="Importación CSV.",
                )
            )
            creados += 1
            continue

        previous_status = existing.estado_actual
        existing.nombre = row.nombre
        existing.codigo_inventario = row.codigo_inventario
        existing.tipo = row.tipo
        existing.descripcion = row.descripcion
        existing.imagen_url = row.imagen_url
        existing.cantidad_total = row.cantidad_total
        existing.cantidad_disponible = row.cantidad_disponible
        existing.estado_actual = row.estado_actual
        if previous_status != row.estado_actual:
            db.add(
                ResourceStatusHistory(
                    resource_id=existing.id,
                    estado=row.estado_actual,
                    motivo="Importación CSV.",
                )
            )
        actualizados += 1

    db.flush()
    return ResourceImportResult(
        confirmado=True,
        total_filas=total,
        filas_validas=len(rows),
        creados=creados,
        actualizados=actualizados,
        filas=rows,
        errores=errors,
    )
