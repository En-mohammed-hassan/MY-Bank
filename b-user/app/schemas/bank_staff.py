from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.enums import BankStaffRole, StaffStatus, normalize_staff_role


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

    @field_validator("role", mode="before")
    @classmethod
    def coerce_legacy_role(cls, value: str | BankStaffRole) -> BankStaffRole:
        if isinstance(value, BankStaffRole):
            return value
        return normalize_staff_role(str(value))


class BankStaffListResponse(BaseModel):
    items: list[BankStaffResponse]
    total: int
