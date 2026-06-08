from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.hold import AccountHold
from app.models.transfer import TransferRequest
from app.schemas.enums import (
    AccountStatus,
    DebitCredit,
    HoldStatus,
    ProductCategory,
    TransferSimulateMode,
    TransferStatus,
    TxnCode,
)
from app.schemas.transfer import TransferRequest as TransferRequestSchema
from app.schemas.transfer import TransferResponse
from app.services.balance_service import compute_available_balance
from app.services.ledger_service import post_ledger_entry


class TransferError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


READ_ONLY_CATEGORIES = {ProductCategory.TDA.value, ProductCategory.LOAN.value}
BLOCKED_STATUSES = {AccountStatus.FROZEN.value, AccountStatus.CLOSED.value}


def _get_account(db: Session, account_number: str) -> Account:
    account = db.query(Account).filter(Account.account_number == account_number).first()
    if not account:
        raise TransferError(f"Account {account_number} not found", 404)
    return account


def _validate_transfer_accounts(from_acc: Account, to_acc: Account) -> None:
    if from_acc.status in BLOCKED_STATUSES:
        raise TransferError(f"Source account {from_acc.account_number} is {from_acc.status}", 400)
    if to_acc.status in BLOCKED_STATUSES:
        raise TransferError(f"Destination account {to_acc.account_number} is {to_acc.status}", 400)
    if from_acc.product_category in READ_ONLY_CATEGORIES:
        raise TransferError(f"Source account type {from_acc.product_category} is read-only for transfers", 400)
    if to_acc.product_category in READ_ONLY_CATEGORIES:
        raise TransferError(f"Destination account type {to_acc.product_category} is read-only for transfers", 400)
    if from_acc.currency != to_acc.currency:
        raise TransferError("Currency mismatch between accounts", 400)


def _to_response(transfer: TransferRequest, replay: bool = False) -> TransferResponse:
    return TransferResponse(
        id=transfer.id,
        idempotency_key=transfer.idempotency_key,
        from_account=transfer.from_account,
        to_account=transfer.to_account,
        amount=transfer.amount,
        currency=transfer.currency,
        status=transfer.status,
        failure_reason=transfer.failure_reason,
        reference=transfer.reference,
        value_date=transfer.value_date,
        created_at=transfer.created_at,
        updated_at=transfer.updated_at,
        replay=replay,
    )


def execute_internal_transfer(db: Session, request: TransferRequestSchema) -> TransferResponse:
    existing = (
        db.query(TransferRequest)
        .filter(TransferRequest.idempotency_key == request.idempotency_key)
        .first()
    )
    if existing:
        return _to_response(existing, replay=True)

    from_acc = _get_account(db, request.from_account)
    to_acc = _get_account(db, request.to_account)

    if request.from_account == request.to_account:
        raise TransferError("Source and destination accounts must differ", 400)

    if from_acc.currency != request.currency:
        raise TransferError(f"Source account currency {from_acc.currency} does not match request {request.currency}", 400)

    _validate_transfer_accounts(from_acc, to_acc)

    simulate = request.simulate
    today = date.today()

    if simulate == TransferSimulateMode.FAILED:
        transfer = TransferRequest(
            idempotency_key=request.idempotency_key,
            from_account=request.from_account,
            to_account=request.to_account,
            amount=request.amount,
            currency=request.currency,
            status=TransferStatus.FAILED.value,
            failure_reason="CORE_REJECTED",
            reference=request.reference,
            value_date=today,
        )
        db.add(transfer)
        db.commit()
        db.refresh(transfer)
        return _to_response(transfer)

    if simulate == TransferSimulateMode.PENDING:
        transfer = TransferRequest(
            idempotency_key=request.idempotency_key,
            from_account=request.from_account,
            to_account=request.to_account,
            amount=request.amount,
            currency=request.currency,
            status=TransferStatus.PENDING.value,
            failure_reason=None,
            reference=request.reference,
            value_date=today,
        )
        db.add(transfer)
        db.commit()
        db.refresh(transfer)
        return _to_response(transfer)

    available = compute_available_balance(from_acc)
    force_insufficient = simulate == TransferSimulateMode.INSUFFICIENT_FUNDS
    insufficient = force_insufficient or available < request.amount

    if insufficient:
        transfer = TransferRequest(
            idempotency_key=request.idempotency_key,
            from_account=request.from_account,
            to_account=request.to_account,
            amount=request.amount,
            currency=request.currency,
            status=TransferStatus.FAILED.value,
            failure_reason="INSUFFICIENT_FUNDS",
            reference=request.reference,
            value_date=today,
        )
        db.add(transfer)
        db.commit()
        db.refresh(transfer)
        return _to_response(transfer)

    # Success path (auto resolves to success when funds available, or explicit success)
    try:
        from_acc = db.query(Account).filter(Account.account_number == request.from_account).with_for_update().one()
        to_acc = db.query(Account).filter(Account.account_number == request.to_account).with_for_update().one()

        _validate_transfer_accounts(from_acc, to_acc)
        available = compute_available_balance(from_acc)
        if available < request.amount:
            raise TransferError("Insufficient funds", 400)

        transfer = TransferRequest(
            idempotency_key=request.idempotency_key,
            from_account=request.from_account,
            to_account=request.to_account,
            amount=request.amount,
            currency=request.currency,
            status=TransferStatus.COMPLETED.value,
            failure_reason=None,
            reference=request.reference,
            value_date=today,
        )
        db.add(transfer)
        db.flush()

        from_acc.ledger_balance -= request.amount
        to_acc.ledger_balance += request.amount

        post_ledger_entry(
            db,
            from_acc,
            txn_code=TxnCode.TRANSFER_OUT,
            debit_credit=DebitCredit.DEBIT,
            amount=request.amount,
            reference=request.reference,
            narration=f"Transfer to {request.to_account}",
            value_date=today,
            booking_date=today,
            transfer_id=transfer.id,
        )
        post_ledger_entry(
            db,
            to_acc,
            txn_code=TxnCode.TRANSFER_IN,
            debit_credit=DebitCredit.CREDIT,
            amount=request.amount,
            reference=request.reference,
            narration=f"Transfer from {request.from_account}",
            value_date=today,
            booking_date=today,
            transfer_id=transfer.id,
        )

        db.commit()
        db.refresh(transfer)
        return _to_response(transfer)
    except TransferError:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise TransferError(f"Transfer failed: {exc}", 500) from exc


def place_hold(
    db: Session,
    account_number: str,
    amount: Decimal,
    reason: str,
    reference: str | None = None,
    expires_at=None,
) -> AccountHold:
    account = _get_account(db, account_number)
    if account.status in BLOCKED_STATUSES:
        raise TransferError(f"Account {account_number} is {account.status}", 400)

    hold = AccountHold(
        account_number=account_number,
        amount=amount,
        reason=reason,
        reference=reference,
        status=HoldStatus.ACTIVE.value,
        expires_at=expires_at,
    )
    account.hold_amount += amount
    db.add(hold)

    post_ledger_entry(
        db,
        account,
        txn_code=TxnCode.HOLD_PLACE,
        debit_credit=DebitCredit.DEBIT,
        amount=amount,
        reference=reference,
        narration=f"Hold placed: {reason}",
    )

    db.commit()
    db.refresh(hold)
    return hold
