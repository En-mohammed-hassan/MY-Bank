from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.auth import require_roles
from app.schemas.enums import BankStaffRole, CustomerPortalRole
from app.models.account import Account
from app.models.customer import Customer
from app.schemas.account import AccountListResponse, AccountResponse
from app.schemas.customer import CustomerResponse
from app.services.balance_service import account_to_response

router = APIRouter(prefix="/core", tags=["customers"])

_ALL_STAFF = (BankStaffRole.ADMIN, BankStaffRole.SUPERVISOR, BankStaffRole.RETAIL)
_CUSTOMER_READ = (CustomerPortalRole.EDITOR, CustomerPortalRole.VIEWER)
_READ_ROLES = _ALL_STAFF + _CUSTOMER_READ


@router.get("/customers/{cif}", response_model=CustomerResponse)
def get_customer(
    cif: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_READ_ROLES)),
) -> CustomerResponse:
    customer = db.query(Customer).filter(Customer.cif == cif).first()
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer {cif} not found")
    return CustomerResponse.model_validate(customer)


@router.get("/customers/{cif}/accounts", response_model=AccountListResponse)
def list_customer_accounts(
    cif: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_READ_ROLES)),
) -> AccountListResponse:
    customer = db.query(Customer).filter(Customer.cif == cif).first()
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer {cif} not found")

    accounts = db.query(Account).filter(Account.cif == cif).order_by(Account.account_number).all()
    account_responses = [AccountResponse(**account_to_response(acc)) for acc in accounts]

    return AccountListResponse(cif=cif, accounts=account_responses, total=len(account_responses))
