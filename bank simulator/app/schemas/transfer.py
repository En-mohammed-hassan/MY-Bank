from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import TransferSimulateMode, TransferStatus


class TransferRequest(BaseModel):
    from_account: str
    to_account: str
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    currency: str = "USD"
    reference: str | None = None
    idempotency_key: str
    simulate: TransferSimulateMode = TransferSimulateMode.AUTO


class TransferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    idempotency_key: str
    from_account: str
    to_account: str
    amount: Decimal
    currency: str
    status: TransferStatus
    failure_reason: str | None
    reference: str | None
    value_date: date
    created_at: datetime
    updated_at: datetime | None = None
    replay: bool = False
