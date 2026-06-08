from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.enums import BankStaffRole, StaffStatus


class BankStaffCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    role: BankStaffRole
    department: str | None = Field(default=None, max_length=128)
    temporary_password: str = Field(..., min_length=8, max_length=128)


class BankStaffRoleUpdateRequest(BaseModel):
    role: BankStaffRole


class BankStaffStatusUpdateRequest(BaseModel):
    status: StaffStatus


class BankStaffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    keycloak_user_id: UUID
    username: str
    email: str
    full_name: str
    role: BankStaffRole
    status: StaffStatus
    department: str | None
    created_at: datetime
    updated_at: datetime


class BankStaffListResponse(BaseModel):
    items: list[BankStaffResponse]
    total: int
