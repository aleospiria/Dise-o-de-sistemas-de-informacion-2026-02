from __future__ import annotations

import csv
import io
from datetime import datetime, timedelta

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import bad_request
from app.domain.enums import LoanStatus, ResourceType
from app.domain.validators import ensure_aware
from app.models import Loan, Resource, User
from app.schemas.report import ReportResponse, ReportRow, ReportStats

MAX_REPORT_DAYS = 366

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
    id_usuario: str | None = None,
) -> ReportResponse:
    if desde is not None and hasta is not None:
        start = ensure_aware(desde)
        end = ensure_aware(hasta)
        if end < start:
            raise bad_request("La fecha de fin debe ser posterior a la fecha de inicio.")
        if end - start > timedelta(days=MAX_REPORT_DAYS):
            raise bad_request("El rango del reporte no puede superar 1 año.")
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
    if id_usuario:
        statement = statement.where(Loan.user_id == id_usuario)
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


def report_to_pdf(report: ReportResponse) -> bytes:
    buffer = io.BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=1.2 * cm,
        rightMargin=1.2 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
        title="Reporte de préstamos",
    )
    styles = getSampleStyleSheet()
    elements = [
        Paragraph("Reporte de préstamos", styles["Title"]),
        Spacer(1, 0.4 * cm),
        Paragraph(
            "Total de préstamos: "
            f"<b>{report.estadisticas.total_prestamos}</b> &nbsp;&nbsp; "
            "Con demora: "
            f"<b>{report.estadisticas.prestamos_con_demora}</b> &nbsp;&nbsp; "
            "Duración promedio: "
            f"<b>{report.estadisticas.promedio_duracion_horas:.2f} h</b>",
            styles["BodyText"],
        ),
        Spacer(1, 0.4 * cm),
    ]

    table_data = [
        [
            "Fecha",
            "Recurso",
            "Estudiante",
            "Estado",
            "Tipo",
            "Retraso (h)",
        ]
    ]
    for row in report.filas:
        table_data.append(
            [
                row.fecha.astimezone().strftime("%Y-%m-%d %H:%M"),
                row.recurso,
                row.estudiante,
                row.estado.value.replace("_", " "),
                row.tipo_recurso.value,
                "" if row.retraso_horas is None else f"{row.retraso_horas:.2f}",
            ]
        )
    if len(table_data) == 1:
        table_data.append(["Sin resultados para los filtros seleccionados.", "", "", "", "", ""])

    table = Table(
        table_data,
        colWidths=[3.2 * cm, 5.6 * cm, 5.2 * cm, 3.2 * cm, 3.2 * cm, 2.8 * cm],
        repeatRows=1,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f4e79")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#b7c4d1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f5f8")]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    elements.append(table)
    document.build(elements)
    return buffer.getvalue()


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
