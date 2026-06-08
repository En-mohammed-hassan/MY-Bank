from decimal import Decimal

from app.models.account import Account
from app.schemas.enums import AccountSubType, ProductCategory


def compute_usable_overdraft(account: Account) -> Decimal:
    """Compute usable overdraft headroom for OD-enabled accounts."""
    if account.overdraft_limit <= 0:
        return Decimal("0")

    is_od_product = account.product_category == ProductCategory.OD.value
    is_current_with_od = (
        account.product_category == ProductCategory.CASA.value
        and account.account_sub_type == AccountSubType.CURRENT.value
        and account.overdraft_limit > 0
    )

    if not is_od_product and not is_current_with_od:
        return Decimal("0")

    if is_od_product:
        headroom = account.overdraft_limit + account.ledger_balance
        return max(Decimal("0"), min(account.overdraft_limit, headroom))

    # CURRENT with OD facility: overdraft only applies when drawing below zero
    if account.ledger_balance >= 0:
        return Decimal("0")
    headroom = account.overdraft_limit + account.ledger_balance
    return max(Decimal("0"), headroom)


def compute_available_balance(account: Account) -> Decimal:
    """available_balance = ledger_balance - hold_amount + usable_overdraft"""
    usable_od = compute_usable_overdraft(account)
    return account.ledger_balance - account.hold_amount + usable_od


def account_to_response(account: Account) -> dict:
    available = compute_available_balance(account)
    return {
        "account_number": account.account_number,
        "cif": account.cif,
        "product_category": account.product_category,
        "account_sub_type": account.account_sub_type,
        "product_code": account.product_code,
        "branch_code": account.branch_code,
        "currency": account.currency,
        "ledger_balance": account.ledger_balance,
        "hold_amount": account.hold_amount,
        "overdraft_limit": account.overdraft_limit,
        "available_balance": available,
        "status": account.status,
        "opened_at": account.opened_at,
    }
