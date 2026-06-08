from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.enums import DebitCredit, TxnCode
from app.services.balance_service import compute_available_balance


def post_ledger_entry(
    db: Session,
    account: Account,
    *,
    txn_code: TxnCode,
    debit_credit: DebitCredit,
    amount: Decimal,
    reference: str | None = None,
    narration: str | None = None,
    value_date: date | None = None,
    booking_date: date | None = None,
    transfer_id: int | None = None,
) -> Transaction:
    today = date.today()
    vd = value_date or today
    bd = booking_date or today

    ledger_after = account.ledger_balance
    available_after = compute_available_balance(account)

    entry = Transaction(
        account_number=account.account_number,
        txn_code=txn_code.value,
        debit_credit=debit_credit.value,
        amount=amount,
        ledger_balance_after=ledger_after,
        available_balance_after=available_after,
        reference=reference,
        narration=narration,
        value_date=vd,
        booking_date=bd,
        transfer_id=transfer_id,
    )
    db.add(entry)
    return entry
