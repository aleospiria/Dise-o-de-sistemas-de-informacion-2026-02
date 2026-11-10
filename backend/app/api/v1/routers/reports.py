from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_staff
from app.db.session import get_db
from app.domain.enums import LoanStatus, ResourceType
from app.models import User
from app.schemas.common import Envelope, ok
from app.schemas.report import DashboardResponse, ReportResponse
from app.services import dashboard_service, report_service

router = APIRouter(tags=["reports"])


@router.get("/dashboard", response_model=Envelope[DashboardResponse])
def get_dashboard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[DashboardResponse]:
    return ok(dashboard_service.build_dashboard(db, user))


@router.get("/reports/loans", response_model=Envelope[ReportResponse])
def get_report(
    desde: datetime | None = Query(default=None),
    hasta: datetime | None = Query(default=None),
    id_recurso: str | None = Query(default=None),
    tipo_recurso: ResourceType | None = Query(default=None),
    estado: LoanStatus | None = Query(default=None),
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Envelope[ReportResponse]:
    report = report_service.build_report(
        db,
        desde=desde,
        hasta=hasta,
        id_recurso=id_recurso,
        tipo_recurso=tipo_recurso,
        estado=estado,
    )
    return ok(report)


@router.get("/reports/loans/csv")
def export_report(
    desde: datetime | None = Query(default=None),
    hasta: datetime | None = Query(default=None),
    id_recurso: str | None = Query(default=None),
    tipo_recurso: ResourceType | None = Query(default=None),
    estado: LoanStatus | None = Query(default=None),
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Response:
    report = report_service.build_report(
        db,
        desde=desde,
        hasta=hasta,
        id_recurso=id_recurso,
        tipo_recurso=tipo_recurso,
        estado=estado,
    )
    content = report_service.report_to_csv(report)
    return Response(
        content=content.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="reporte_prestamos.csv"'},
    )
