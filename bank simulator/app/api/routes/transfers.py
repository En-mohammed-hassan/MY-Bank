from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.transfer import TransferRequest, TransferResponse
from app.services.transfer_service import TransferError, execute_internal_transfer

router = APIRouter(prefix="/core", tags=["transfers"])


@router.post("/transfers/internal", response_model=TransferResponse)
def internal_transfer(body: TransferRequest, db: Session = Depends(get_db)) -> TransferResponse:
    try:
        return execute_internal_transfer(db, body)
    except TransferError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
