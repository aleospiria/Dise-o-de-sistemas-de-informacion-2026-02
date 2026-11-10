from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin, require_staff
from app.db.session import get_db
from app.domain.enums import SanctionStatus
from app.models import User
from app.schemas.common import Envelope, ok
from app.schemas.sanction import SanctionResponse
from app.services import sanction_service

router = APIRouter(prefix="/sanctions", tags=["sanctions"])


@router.get("", response_model=Envelope[list[SanctionResponse]])
def list_sanctions(
    estado: SanctionStatus | None = Query(default=None),
    id_usuario: str | None = Query(default=None),
    _: User = Depends(require_staff),
    db: Session = Depends(get_db),
) -> Envelope[list[SanctionResponse]]:
    sanctions = sanction_service.list_sanctions(db, estado=estado, user_id=id_usuario)
    return ok([SanctionResponse.model_validate(sanction) for sanction in sanctions])


@router.get("/me", response_model=Envelope[list[SanctionResponse]])
def my_sanctions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Envelope[list[SanctionResponse]]:
    sanctions = sanction_service.list_user_sanctions(db, user.id)
    return ok([SanctionResponse.model_validate(sanction) for sanction in sanctions])


@router.post("/{sanction_id}/lift", response_model=Envelope[SanctionResponse])
def lift_sanction(
    sanction_id: str,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Envelope[SanctionResponse]:
    sanction = sanction_service.lift_sanction(db, sanction_id)
    return ok(SanctionResponse.model_validate(sanction))
