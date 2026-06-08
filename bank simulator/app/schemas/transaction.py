from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import DebitCredit, TxnCode


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_number: str
    txn_code: TxnCode
    debit_credit: DebitCredit
    amount: Decimal
    ledger_balance_after: Decimal
    available_balance_after: Decimal
    reference: str | None
    narration: str | None
    value_date: date
    booking_date: date
    transfer_id: int | None
    created_at: datetime | None = None


class TransactionListResponse(BaseModel):
    account_number: str
    transactions: list[TransactionResponse]
    total: int
    limit: int
    offset: int
