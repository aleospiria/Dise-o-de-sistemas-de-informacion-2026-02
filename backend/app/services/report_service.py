from __future__ import annotations

import csv
import io
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.enums import LoanStatus, ResourceType
from app.domain.validators import ensure_aware
from app.models import Loan, Resource, User
from app.schemas.report import ReportResponse, ReportRow, ReportStats

REPORT_COLUMNS = [
    "id_prestamo",
    "fecha",
    "recurso",
    "estudiante",
    "estado",
    "tipo_recurso",
    "id_recurso",
    "id_usuario",
    "retraso_horas",
]


def build_report(
    db: Session,
    desde: datetime | None = None,
    hasta: datetime | None = None,
    id_recurso: str | None = None,
    tipo_recurso: ResourceType | None = None,
    estado: LoanStatus | None = None,
) -> ReportResponse:
    statement = (
        select(Loan, Resource, User)
        .join(Resource, Loan.resource_id == Resource.id)
        .join(User, Loan.user_id == User.id)
    )
    if desde is not None:
        statement = statement.where(Loan.fecha_hora_inicio_programada >= ensure_aware(desde))
    if hasta is not None:
        statement = statement.where(Loan.fecha_hora_inicio_programada <= ensure_aware(hasta))
    if id_recurso:
        statement = statement.where(Loan.resource_id == id_recurso)
    if tipo_recurso is not None:
        statement = statement.where(Resource.tipo == tipo_recurso)
    if estado is not None:
        statement = statement.where(Loan.estado_prestamo == estado)
    statement = statement.order_by(Loan.fecha_hora_inicio_programada.desc())

    rows: list[ReportRow] = []
    counter: dict[str, int] = {}
    durations: list[float] = []
    delayed = 0
    for loan, resource, student in db.execute(statement).all():
        rows.append(
            ReportRow(
                id_prestamo=loan.id,
                fecha=loan.fecha_hora_inicio_programada,
                recurso=resource.nombre,
                estudiante=student.nombre,
                estado=loan.estado_prestamo,
                tipo_recurso=resource.tipo,
                id_recurso=resource.id,
                id_usuario=student.id,
                retraso_horas=loan.retraso_horas,
            )
        )
        counter[resource.nombre] = counter.get(resource.nombre, 0) + 1
        duration = loan.fecha_hora_fin_programada - loan.fecha_hora_inicio_programada
        durations.append(duration.total_seconds() / 3600)
        if (loan.retraso_horas or 0) > 0:
            delayed += 1

    most_requested = max(counter, key=lambda name: counter[name]) if counter else None
    stats = ReportStats(
        total_prestamos=len(rows),
        prestamos_con_demora=delayed,
        promedio_duracion_horas=(round(sum(durations) / len(durations), 2) if durations else 0.0),
        recurso_mas_solicitado=most_requested,
        recurso_mas_solicitado_cantidad=(counter.get(most_requested, 0) if most_requested else 0),
    )
    return ReportResponse(filas=rows, estadisticas=stats)


def report_to_csv(report: ReportResponse) -> str:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=REPORT_COLUMNS)
    writer.writeheader()
    for row in report.filas:
        writer.writerow(
            {
                "id_prestamo": row.id_prestamo,
                "fecha": row.fecha.isoformat(),
                "recurso": row.recurso,
                "estudiante": row.estudiante,
                "estado": row.estado.value,
                "tipo_recurso": row.tipo_recurso.value,
                "id_recurso": row.id_recurso,
                "id_usuario": row.id_usuario,
                "retraso_horas": row.retraso_horas if row.retraso_horas is not None else "",
            }
        )
    return buffer.getvalue()
