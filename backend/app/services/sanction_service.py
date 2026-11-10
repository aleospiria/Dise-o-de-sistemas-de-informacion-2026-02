from __future__ import annotations

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import not_found
from app.domain.enums import SanctionStatus
from app.domain.validators import now_utc
from app.models import Loan, Sanction, User
from app.services.notification_service import create_notification


def refresh_expired_sanctions(db: Session) -> None:
    now = now_utc()
    expired = db.scalars(
        select(Sanction).where(
            Sanction.estado == SanctionStatus.ACTIVA,
            Sanction.fecha_fin <= now,
        )
    ).all()
    for sanction in expired:
        sanction.estado = SanctionStatus.EXPIRADA
    users = db.scalars(
        select(User).where(
            User.sanction_end_date.is_not(None),
            User.sanction_end_date <= now,
        )
    ).all()
    for user in users:
        user.sanction_end_date = None
    if expired or users:
        db.flush()


def get_active_sanction(db: Session, user_id: str) -> Sanction | None:
    refresh_expired_sanctions(db)
    return db.scalar(
        select(Sanction).where(
            Sanction.user_id == user_id,
            Sanction.estado == SanctionStatus.ACTIVA,
            Sanction.fecha_fin > now_utc(),
        )
    )


def apply_sanction_for_loan(
    db: Session,
    loan: Loan,
    retraso_horas: float,
) -> Sanction | None:
    if retraso_horas <= 24:
        return None
    existing = db.scalar(select(Sanction).where(Sanction.loan_id == loan.id))
    if existing is not None:
        return existing
    days_late = int(retraso_horas // 24)
    duration_days = days_late * 2
    now = now_utc()
    sanction = Sanction(
        user_id=loan.user_id,
        loan_id=loan.id,
        fecha_inicio=now,
        fecha_fin=now + timedelta(days=duration_days),
        motivo=(f"Devolución con {retraso_horas:.1f} horas de demora en el préstamo {loan.id}."),
        estado=SanctionStatus.ACTIVA,
    )
    db.add(sanction)
    user = db.get(User, loan.user_id)
    if user is not None:
        if user.sanction_end_date is None or user.sanction_end_date < sanction.fecha_fin:
            user.sanction_end_date = sanction.fecha_fin
        create_notification(
            db,
            user.id,
            (
                f"Se aplicó una sanción de {duration_days} días por demora. "
                f"Finaliza el {sanction.fecha_fin.isoformat()}."
            ),
        )
    db.flush()
    return sanction


def list_sanctions(
    db: Session,
    estado: SanctionStatus | None = None,
    user_id: str | None = None,
) -> list[Sanction]:
    refresh_expired_sanctions(db)
    statement = select(Sanction)
    if estado is not None:
        statement = statement.where(Sanction.estado == estado)
    if user_id:
        statement = statement.where(Sanction.user_id == user_id)
    statement = statement.order_by(Sanction.fecha_inicio.desc())
    return list(db.scalars(statement).all())


def list_user_sanctions(db: Session, user_id: str) -> list[Sanction]:
    return list_sanctions(db, user_id=user_id)


def lift_sanction(db: Session, sanction_id: str) -> Sanction:
    sanction = db.get(Sanction, sanction_id)
    if sanction is None:
        raise not_found("Sanción")
    sanction.estado = SanctionStatus.EXPIRADA
    user = db.get(User, sanction.user_id)
    if user is not None:
        other = db.scalar(
            select(Sanction).where(
                Sanction.user_id == user.id,
                Sanction.id != sanction.id,
                Sanction.estado == SanctionStatus.ACTIVA,
                Sanction.fecha_fin > now_utc(),
            )
        )
        user.sanction_end_date = other.fecha_fin if other is not None else None
        create_notification(
            db,
            user.id,
            "Tu sanción fue levantada por un administrador.",
        )
    db.flush()
    return sanction
