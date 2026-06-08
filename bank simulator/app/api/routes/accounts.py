from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.account import Account
from app.models.hold import AccountHold
from app.models.transaction import Transaction
from app.schemas.account import AccountResponse
from app.schemas.enums import HoldStatus, TxnCode
from app.schemas.hold import HoldCreateRequest, HoldListResponse, HoldResponse
from app.schemas.transaction import TransactionListResponse, TransactionResponse
from app.services.balance_service import account_to_response
from app.services.transfer_service import TransferError, place_hold

router = APIRouter(prefix="/core", tags=["accounts"])


@router.get("/accounts/{account_number}", response_model=AccountResponse)
def get_account(account_number: str, db: Session = Depends(get_db)) -> AccountResponse:
    account = db.query(Account).filter(Account.account_number == account_number).first()
    if not account:
        raise HTTPException(status_code=404, detail=f"Account {account_number} not found")
    return AccountResponse(**account_to_response(account))


@router.get("/accounts/{account_number}/transactions", response_model=TransactionListResponse)
def list_account_transactions(
    account_number: str,
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    txn_code: TxnCode | None = None,
    value_date_from: date | None = None,
    value_date_to: date | None = None,
) -> TransactionListResponse:
    account = db.query(Account).filter(Account.account_number == account_number).first()
    if not account:
        raise HTTPException(status_code=404, detail=f"Account {account_number} not found")

    query = db.query(Transaction).filter(Transaction.account_number == account_number)

    if txn_code:
        query = query.filter(Transaction.txn_code == txn_code.value)
    if value_date_from:
        query = query.filter(Transaction.value_date >= value_date_from)
    if value_date_to:
        query = query.filter(Transaction.value_date <= value_date_to)

    total = query.count()
    transactions = (
        query.order_by(Transaction.created_at.desc(), Transaction.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return TransactionListResponse(
        account_number=account_number,
        transactions=[TransactionResponse.model_validate(t) for t in transactions],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/accounts/{account_number}/holds", response_model=HoldListResponse)
def list_account_holds(
    account_number: str,
    db: Session = Depends(get_db),
    active_only: bool = Query(default=True),
) -> HoldListResponse:
    account = db.query(Account).filter(Account.account_number == account_number).first()
    if not account:
        raise HTTPException(status_code=404, detail=f"Account {account_number} not found")

    query = db.query(AccountHold).filter(AccountHold.account_number == account_number)
    if active_only:
        query = query.filter(AccountHold.status == HoldStatus.ACTIVE.value)

    holds = query.order_by(AccountHold.created_at.desc()).all()

    return HoldListResponse(
        account_number=account_number,
        holds=[HoldResponse.model_validate(h) for h in holds],
        total=len(holds),
    )


@router.post("/accounts/{account_number}/holds", response_model=HoldResponse, status_code=201)
def create_account_hold(
    account_number: str,
    body: HoldCreateRequest,
    db: Session = Depends(get_db),
) -> HoldResponse:
    try:
        hold = place_hold(
            db,
            account_number,
            amount=body.amount,
            reason=body.reason.value,
            reference=body.reference,
            expires_at=body.expires_at,
        )
        return HoldResponse.model_validate(hold)
    except TransferError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
