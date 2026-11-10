from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_staff
from app.core.errors import forbidden
from app.db.session import get_db
from app.domain.enums import LoanStatus, UserRole
from app.models import User
from app.schemas.common import Envelope, ok
from app.schemas.loan import (
    DeliveryRequest,
    LoanCreateRequest,
    LoanResponse,
    LoanSeriesResponse,
    RecurringLoanRequest,
    RecurringLoanResponse,
    ReturnRequest,
)
from app.services import loan_service

router = APIRouter(prefix="/loans", tags=["loans"])


@router.post(
    "",
    response_model=Envelope[LoanResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_loan(
    data: LoanCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[LoanResponse]:
    loan = loan_service.create_loan(db, user, data)
    return ok(LoanResponse.model_validate(loan))


@router.post(
    "/recurring",
    response_model=Envelope[RecurringLoanResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_recurring(
    data: RecurringLoanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[RecurringLoanResponse]:
    series, loans, conflicts, omitted = loan_service.create_recurring_loans(db, user, data)
    return ok(
        RecurringLoanResponse(
            serie=LoanSeriesResponse.model_validate(series),
            prestamos=[LoanResponse.model_validate(loan) for loan in loans],
            conflictos=conflicts,
            omitidos=omitted,
        )
    )


@router.get("/my", response_model=Envelope[list[LoanResponse]])
def my_loans(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[list[LoanResponse]]:
    loans = loan_service.get_loans_by_user(db, user.id)
    return ok([LoanResponse.model_validate(loan) for loan in loans])


@router.get("/pending/deliveries", response_model=Envelope[list[LoanResponse]])
def pending_deliveries(
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Envelope[list[LoanResponse]]:
    loans = loan_service.get_pending_deliveries(db)
    return ok([LoanResponse.model_validate(loan) for loan in loans])


@router.get("/pending/returns", response_model=Envelope[list[LoanResponse]])
def pending_returns(
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Envelope[list[LoanResponse]]:
    loans = loan_service.get_pending_returns(db)
    return ok([LoanResponse.model_validate(loan) for loan in loans])


@router.get("", response_model=Envelope[list[LoanResponse]])
def list_loans(
    id_usuario: str | None = Query(default=None),
    id_recurso: str | None = Query(default=None),
    estado: LoanStatus | None = Query(default=None),
    desde: datetime | None = Query(default=None),
    hasta: datetime | None = Query(default=None),
    actor: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[list[LoanResponse]]:
    if actor.role == UserRole.ESTUDIANTE:
        loans = loan_service.get_loans_by_user(db, actor.id)
    else:
        loans = loan_service.list_loans(
            db,
            user_id=id_usuario,
            resource_id=id_recurso,
            estado=estado,
            fecha_inicio=desde,
            fecha_fin=hasta,
        )
    return ok([LoanResponse.model_validate(loan) for loan in loans])


@router.get("/series/{series_id}", response_model=Envelope[LoanSeriesResponse])
def get_series(
    series_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[LoanSeriesResponse]:
    series = loan_service.get_series(db, series_id, user)
    return ok(LoanSeriesResponse.model_validate(series))


@router.get("/{loan_id}", response_model=Envelope[LoanResponse])
def get_loan(
    loan_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[LoanResponse]:
    loan = loan_service.get_loan(db, loan_id)
    if user.role == UserRole.ESTUDIANTE and loan.user_id != user.id:
        raise forbidden("No puedes acceder a préstamos de otro usuario.")
    return ok(LoanResponse.model_validate(loan))


@router.post("/{loan_id}/delivery", response_model=Envelope[LoanResponse])
def register_delivery(
    loan_id: str,
    data: DeliveryRequest,
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Envelope[LoanResponse]:
    return ok(LoanResponse.model_validate(loan_service.register_delivery(db, loan_id, data)))


@router.post("/{loan_id}/return", response_model=Envelope[LoanResponse])
def register_return(
    loan_id: str,
    data: ReturnRequest,
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Envelope[LoanResponse]:
    return ok(LoanResponse.model_validate(loan_service.register_return(db, loan_id, data)))


@router.post("/{loan_id}/cancel", response_model=Envelope[list[LoanResponse]])
def cancel_loan(
    loan_id: str,
    cancelar_serie: bool = Query(default=False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[list[LoanResponse]]:
    loans = loan_service.cancel_loan(db, user, loan_id, cancelar_serie=cancelar_serie)
    return ok([LoanResponse.model_validate(loan) for loan in loans])
