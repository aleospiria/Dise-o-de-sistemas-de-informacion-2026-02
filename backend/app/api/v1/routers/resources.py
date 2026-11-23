from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_staff
from app.core.errors import bad_request
from app.db.session import get_db
from app.domain.enums import ResourceStatus, ResourceType
from app.models import User
from app.schemas.common import Envelope, ok
from app.schemas.resource import (
    AvailabilityResponse,
    ResourceAvailabilityResponse,
    ResourceCalendarResponse,
    ResourceCreateRequest,
    ResourceImportResult,
    ResourceResponse,
    ResourceStatusHistoryResponse,
    ResourceStatusUpdateRequest,
    ResourceUpdateRequest,
)
from app.services import csv_service, resource_service

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("", response_model=Envelope[list[ResourceResponse]])
def list_resources(
    nombre: str | None = Query(default=None),
    tipo: ResourceType | None = Query(default=None),
    estado: ResourceStatus | None = Query(default=None),
    incluir_baja: bool = Query(default=False),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[list[ResourceResponse]]:
    resources = resource_service.list_resources(
        db,
        nombre=nombre,
        tipo=tipo,
        estado=estado,
        incluir_baja=incluir_baja,
    )
    return ok([ResourceResponse.model_validate(resource) for resource in resources])


@router.get("/available", response_model=Envelope[list[ResourceResponse]])
def list_available(
    inicio: datetime = Query(...),
    fin: datetime = Query(...),
    nombre: str | None = Query(default=None),
    tipo: ResourceType | None = Query(default=None),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[list[ResourceResponse]]:
    resources = resource_service.list_available(
        db,
        start=inicio,
        end=fin,
        nombre=nombre,
        tipo=tipo,
    )
    return ok([ResourceResponse.model_validate(resource) for resource in resources])


@router.get(
    "/availability",
    response_model=Envelope[list[ResourceAvailabilityResponse]],
)
def list_with_availability(
    inicio: datetime = Query(...),
    fin: datetime = Query(...),
    nombre: str | None = Query(default=None),
    tipo: ResourceType | None = Query(default=None),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[list[ResourceAvailabilityResponse]]:
    items = resource_service.list_with_availability(
        db,
        start=inicio,
        end=fin,
        nombre=nombre,
        tipo=tipo,
    )
    return ok(
        [
            ResourceAvailabilityResponse(
                **{
                    **ResourceResponse.model_validate(resource).model_dump(),
                    "cantidad_disponible": units,
                },
                disponible=available,
                reservas_activas=overlaps,
                proxima_disponibilidad=next_available,
            )
            for resource, units, overlaps, available, next_available in items
        ]
    )


@router.get("/export/csv")
def export_resources(
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Response:
    content = csv_service.export_resources_csv(db)
    return Response(
        content=content.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="recursos.csv"'},
    )


@router.post("/import", response_model=Envelope[ResourceImportResult])
async def import_resources(
    archivo: UploadFile = File(...),
    confirmar: bool = Form(default=False),
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Envelope[ResourceImportResult]:
    raw = await archivo.read()
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise bad_request("El archivo debe estar codificado en UTF-8.") from exc
    return ok(csv_service.import_resources(db, content, confirm=confirmar))


@router.get("/{resource_id}", response_model=Envelope[ResourceResponse])
def get_resource(
    resource_id: str,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[ResourceResponse]:
    return ok(ResourceResponse.model_validate(resource_service.get_resource(db, resource_id)))


@router.post(
    "",
    response_model=Envelope[ResourceResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_resource(
    data: ResourceCreateRequest,
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Envelope[ResourceResponse]:
    return ok(ResourceResponse.model_validate(resource_service.create_resource(db, data)))


@router.patch("/{resource_id}", response_model=Envelope[ResourceResponse])
def update_resource(
    resource_id: str,
    data: ResourceUpdateRequest,
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Envelope[ResourceResponse]:
    resource = resource_service.update_resource(db, resource_id, data)
    return ok(ResourceResponse.model_validate(resource))


@router.patch("/{resource_id}/status", response_model=Envelope[ResourceResponse])
def update_status(
    resource_id: str,
    data: ResourceStatusUpdateRequest,
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Envelope[ResourceResponse]:
    resource = resource_service.update_status(
        db,
        resource_id,
        data.nuevo_estado,
        data.motivo,
    )
    return ok(ResourceResponse.model_validate(resource))


@router.get(
    "/{resource_id}/calendar",
    response_model=Envelope[ResourceCalendarResponse],
)
def get_calendar(
    resource_id: str,
    desde: date = Query(...),
    hasta: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[ResourceCalendarResponse]:
    return ok(resource_service.get_calendar(db, resource_id, user, desde, hasta))


@router.get(
    "/{resource_id}/history",
    response_model=Envelope[list[ResourceStatusHistoryResponse]],
)
def get_history(
    resource_id: str,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[list[ResourceStatusHistoryResponse]]:
    history = resource_service.get_history(db, resource_id)
    return ok([ResourceStatusHistoryResponse.model_validate(entry) for entry in history])


@router.get("/{resource_id}/availability", response_model=Envelope[AvailabilityResponse])
def get_availability(
    resource_id: str,
    inicio: datetime = Query(...),
    fin: datetime = Query(...),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[AvailabilityResponse]:
    resource = resource_service.get_resource(db, resource_id)
    return ok(
        AvailabilityResponse(
            disponible=resource_service.check_availability(
                db,
                resource.id,
                inicio,
                fin,
            ),
            cantidad_disponible=resource.cantidad_disponible,
            reservas_activas=resource_service.count_overlapping(
                db,
                resource.id,
                inicio,
                fin,
            ),
            proxima_disponibilidad=resource_service.next_availability(db, resource),
        )
    )
