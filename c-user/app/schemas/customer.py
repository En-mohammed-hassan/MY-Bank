from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.enums import CustomerRole, CustomerStatus


class CustomerCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    role: CustomerRole
    cif: str | None = Field(default=None, max_length=32)
    temporary_password: str = Field(..., min_length=8, max_length=128)


class CustomerSelfUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    keycloak_user_id: UUID
    username: str
    email: str
    full_name: str
    cif: str | None
    role: CustomerRole
    status: CustomerStatus
    created_at: datetime
    updated_at: datetime


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
