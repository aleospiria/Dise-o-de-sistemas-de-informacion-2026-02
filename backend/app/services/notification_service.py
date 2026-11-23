from __future__ import annotations

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import conflict, not_found
from app.domain.validators import now_utc
from app.models import AvailabilityRequest, Notification, Resource, User


def create_notification(
    db: Session,
    user_id: str,
    mensaje: str,
    resource_id: str | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        resource_id=resource_id,
        mensaje=mensaje[:500],
    )
    db.add(notification)
    db.flush()
    return notification


def notify_resource_available(db: Session, resource: Resource) -> int:
    requests = db.scalars(
        select(AvailabilityRequest).where(
            AvailabilityRequest.resource_id == resource.id,
            AvailabilityRequest.activa.is_(True),
        )
    ).all()
    now = now_utc()
    for request in requests:
        request.activa = False
        request.fecha_cumplida = now
        create_notification(
            db,
            request.user_id,
            f'El recurso "{resource.nombre}" ya está disponible.',
            resource.id,
        )
    return len(requests)


def request_availability(db: Session, user: User, resource_id: str) -> AvailabilityRequest:
    resource = db.get(Resource, resource_id)
    if resource is None:
        raise not_found("Recurso")
    if resource.cantidad_disponible > 0:
        raise conflict("El recurso ya está disponible; puedes solicitar el préstamo.")
    existing = db.scalar(
        select(AvailabilityRequest).where(
            AvailabilityRequest.user_id == user.id,
            AvailabilityRequest.resource_id == resource_id,
            AvailabilityRequest.activa.is_(True),
        )
    )
    if existing is not None:
        return existing
    request = AvailabilityRequest(user_id=user.id, resource_id=resource_id)
    db.add(request)
    db.flush()
    return request


def cancel_availability_request(db: Session, user: User, resource_id: str) -> None:
    request = db.scalar(
        select(AvailabilityRequest).where(
            AvailabilityRequest.user_id == user.id,
            AvailabilityRequest.resource_id == resource_id,
            AvailabilityRequest.activa.is_(True),
        )
    )
    if request is None:
        raise not_found("Solicitud de disponibilidad")
    request.activa = False
    db.flush()


def list_availability_requests(db: Session, user: User) -> list[AvailabilityRequest]:
    return list(
        db.scalars(
            select(AvailabilityRequest)
            .where(AvailabilityRequest.user_id == user.id)
            .order_by(AvailabilityRequest.fecha_creacion.desc())
        ).all()
    )


def list_notifications(
    db: Session,
    user: User,
    days: int = 7,
    solo_no_leidas: bool = False,
) -> list[Notification]:
    since = now_utc() - timedelta(days=max(1, min(days, 30)))
    statement = select(Notification).where(
        Notification.user_id == user.id,
        Notification.fecha_creacion >= since,
    )
    if solo_no_leidas:
        statement = statement.where(Notification.leida.is_(False))
    statement = statement.order_by(Notification.fecha_creacion.desc())
    return list(db.scalars(statement).all())


def mark_notification_read(db: Session, user: User, notification_id: str) -> Notification:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != user.id:
        raise not_found("Notificación")
    if not notification.leida:
        notification.leida = True
        notification.fecha_lectura = now_utc()
        db.flush()
    return notification


def mark_all_notifications_read(db: Session, user: User) -> int:
    notifications = db.scalars(
        select(Notification).where(
            Notification.user_id == user.id,
            Notification.leida.is_(False),
        )
    ).all()
    now = now_utc()
    for notification in notifications:
        notification.leida = True
        notification.fecha_lectura = now
    db.flush()
    return len(notifications)


def mark_resource_notifications_read(db: Session, user: User, resource_id: str) -> None:
    notifications = db.scalars(
        select(Notification).where(
            Notification.user_id == user.id,
            Notification.resource_id == resource_id,
            Notification.leida.is_(False),
        )
    ).all()
    now = now_utc()
    for notification in notifications:
        notification.leida = True
        notification.fecha_lectura = now
    db.flush()
