from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.common import Envelope, MessageResponse, ok
from app.schemas.notification import (
    AvailabilityRequestCreate,
    AvailabilityRequestResponse,
    NotificationResponse,
)
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=Envelope[list[NotificationResponse]])
def list_notifications(
    days: int = Query(default=7, ge=1, le=30),
    solo_no_leidas: bool = Query(default=False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[list[NotificationResponse]]:
    notifications = notification_service.list_notifications(
        db,
        user,
        days=days,
        solo_no_leidas=solo_no_leidas,
    )
    return ok([NotificationResponse.model_validate(notification) for notification in notifications])


@router.patch("/read-all", response_model=Envelope[MessageResponse])
def mark_all_read(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[MessageResponse]:
    total = notification_service.mark_all_notifications_read(db, user)
    return ok(MessageResponse(message=f"{total} notificaciones marcadas como leídas."))


@router.patch("/{notification_id}/read", response_model=Envelope[NotificationResponse])
def mark_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[NotificationResponse]:
    notification = notification_service.mark_notification_read(db, user, notification_id)
    return ok(NotificationResponse.model_validate(notification))


@router.get(
    "/availability-requests",
    response_model=Envelope[list[AvailabilityRequestResponse]],
)
def list_availability_requests(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[list[AvailabilityRequestResponse]]:
    requests = notification_service.list_availability_requests(db, user)
    return ok([AvailabilityRequestResponse.model_validate(item) for item in requests])


@router.post(
    "/availability-requests",
    response_model=Envelope[AvailabilityRequestResponse],
    status_code=201,
)
def request_availability(
    data: AvailabilityRequestCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[AvailabilityRequestResponse]:
    request = notification_service.request_availability(db, user, data.id_recurso)
    return ok(AvailabilityRequestResponse.model_validate(request))


@router.delete(
    "/availability-requests/{resource_id}",
    response_model=Envelope[MessageResponse],
)
def cancel_availability_request(
    resource_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[MessageResponse]:
    notification_service.cancel_availability_request(db, user, resource_id)
    return ok(MessageResponse(message="Solicitud de disponibilidad cancelada."))
