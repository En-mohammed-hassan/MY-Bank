from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import HoldReason, HoldStatus


class HoldCreateRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    reason: HoldReason
    reference: str | None = None
    expires_at: datetime | None = None


class HoldResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_number: str
    amount: Decimal
    reason: HoldReason
    reference: str | None
    status: HoldStatus
    expires_at: datetime | None
    created_at: datetime | None = None


class HoldListResponse(BaseModel):
    account_number: str
    holds: list[HoldResponse]
    total: int
