from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import AccountStatus, AccountSubType, ProductCategory


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    account_number: str
    cif: str
    product_category: ProductCategory
    account_sub_type: AccountSubType
    product_code: str
    branch_code: str
    currency: str
    ledger_balance: Decimal
    hold_amount: Decimal
    overdraft_limit: Decimal
    available_balance: Decimal
    status: AccountStatus
    opened_at: datetime | None = None


class AccountListResponse(BaseModel):
    cif: str
    accounts: list[AccountResponse]
    total: int
