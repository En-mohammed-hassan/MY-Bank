from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import CustomerStatus, CustomerType


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cif: str
    name: str
    customer_type: CustomerType
    segment: str | None
    status: CustomerStatus
    branch_code: str
    country: str
    created_at: datetime | None = None
