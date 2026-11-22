from __future__ import annotations

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.domain.enums import (
    LoanStatus,
    ResourceStatus,
    SanctionStatus,
    UserRole,
)
from app.domain.validators import now_utc
from app.models import Loan, Notification, Resource, Sanction, User
from app.schemas.report import DashboardResponse
from app.services.sanction_service import refresh_expired_sanctions


def _count(db: Session, statement: Select[int]) -> int:
    return int(db.scalar(statement) or 0)


def build_dashboard(db: Session, user: User) -> DashboardResponse:
    refresh_expired_sanctions(db)
    now = now_utc()
    is_student = user.role in (UserRole.ESTUDIANTE, UserRole.DOCENTE)

    total_recursos = _count(db, select(func.count()).select_from(Resource))
    recursos_disponibles = _count(
        db,
        select(func.count())
        .select_from(Resource)
        .where(Resource.estado_actual == ResourceStatus.DISPONIBLE),
    )
    recursos_en_mantenimiento = _count(
        db,
        select(func.count())
        .select_from(Resource)
        .where(Resource.estado_actual == ResourceStatus.EN_MANTENIMIENTO),
    )
    prestamos_activos = _count(
        db,
        select(func.count())
        .select_from(Loan)
        .where(Loan.estado_prestamo == LoanStatus.EN_PRESTAMO),
    )
    reservas_pendientes = _count(
        db,
        select(func.count()).select_from(Loan).where(Loan.estado_prestamo == LoanStatus.RESERVADO),
    )
    entregas_pendientes = _count(
        db,
        select(func.count())
        .select_from(Loan)
        .where(
            Loan.estado_prestamo == LoanStatus.RESERVADO,
            Loan.fecha_hora_inicio_programada <= now,
        ),
    )
    devoluciones_pendientes = _count(
        db,
        select(func.count())
        .select_from(Loan)
        .where(Loan.estado_prestamo == LoanStatus.EN_PRESTAMO),
    )

    sanction_statement = (
        select(func.count())
        .select_from(Sanction)
        .where(
            Sanction.estado == SanctionStatus.ACTIVA,
            Sanction.fecha_fin > now,
        )
    )
    if is_student:
        sanction_statement = sanction_statement.where(Sanction.user_id == user.id)
    sanciones_activas = _count(db, sanction_statement)

    notificaciones_no_leidas = _count(
        db,
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user.id, Notification.leida.is_(False)),
    )
    mis_prestamos_activos = _count(
        db,
        select(func.count())
        .select_from(Loan)
        .where(
            Loan.user_id == user.id,
            Loan.estado_prestamo.in_([LoanStatus.RESERVADO, LoanStatus.EN_PRESTAMO]),
        ),
    )

    return DashboardResponse(
        rol=user.role.value,
        total_recursos=total_recursos,
        recursos_disponibles=recursos_disponibles,
        recursos_en_mantenimiento=recursos_en_mantenimiento,
        prestamos_activos=prestamos_activos,
        reservas_pendientes=reservas_pendientes,
        entregas_pendientes=entregas_pendientes,
        devoluciones_pendientes=devoluciones_pendientes,
        sanciones_activas=sanciones_activas,
        notificaciones_no_leidas=notificaciones_no_leidas,
        mis_prestamos_activos=mis_prestamos_activos,
    )
