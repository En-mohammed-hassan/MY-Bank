from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.customer import Customer
from app.models.hold import AccountHold
from app.models.transaction import Transaction
from app.models.transfer import TransferRequest
from app.schemas.enums import (
    AccountStatus,
    AccountSubType,
    CustomerStatus,
    CustomerType,
    DebitCredit,
    HoldReason,
    HoldStatus,
    ProductCategory,
    TxnCode,
)
from app.services.balance_service import compute_available_balance
from app.services.ledger_service import post_ledger_entry


def _clear_all(db: Session) -> None:
    db.query(Transaction).delete()
    db.query(TransferRequest).delete()
    db.query(AccountHold).delete()
    db.query(Account).delete()
    db.query(Customer).delete()
    db.flush()


def seed_demo_data(db: Session) -> dict:
    _clear_all(db)

    today = date.today()
    yesterday = today - timedelta(days=1)
    week_ago = today - timedelta(days=7)

    customer1 = Customer(
        cif="CIF10001",
        name="Demo SME Ltd",
        customer_type=CustomerType.SME.value,
        segment="SME-GOLD",
        status=CustomerStatus.ACTIVE.value,
        branch_code="001",
        country="US",
    )
    customer2 = Customer(
        cif="CIF10002",
        name="Partner Retail Co",
        customer_type=CustomerType.RETAIL.value,
        segment="RETAIL-STANDARD",
        status=CustomerStatus.ACTIVE.value,
        branch_code="001",
        country="US",
    )
    db.add_all([customer1, customer2])
    db.flush()

    acc_current = Account(
        account_number="ACC-10001-01",
        cif="CIF10001",
        product_category=ProductCategory.CASA.value,
        account_sub_type=AccountSubType.CURRENT.value,
        product_code="CASA-CUR-001",
        branch_code="001",
        currency="USD",
        ledger_balance=Decimal("5000.00"),
        hold_amount=Decimal("200.00"),
        overdraft_limit=Decimal("1000.00"),
        status=AccountStatus.ACTIVE.value,
    )
    acc_savings = Account(
        account_number="ACC-10001-02",
        cif="CIF10001",
        product_category=ProductCategory.CASA.value,
        account_sub_type=AccountSubType.SAVINGS.value,
        product_code="CASA-SAV-001",
        branch_code="001",
        currency="USD",
        ledger_balance=Decimal("12000.00"),
        hold_amount=Decimal("0.00"),
        overdraft_limit=Decimal("0.00"),
        status=AccountStatus.ACTIVE.value,
    )
    acc_tda = Account(
        account_number="ACC-10001-03",
        cif="CIF10001",
        product_category=ProductCategory.TDA.value,
        account_sub_type=AccountSubType.TERM_DEPOSIT.value,
        product_code="TDA-12M-001",
        branch_code="001",
        currency="USD",
        ledger_balance=Decimal("50000.00"),
        hold_amount=Decimal("0.00"),
        overdraft_limit=Decimal("0.00"),
        status=AccountStatus.ACTIVE.value,
    )
    acc_od = Account(
        account_number="ACC-10001-04",
        cif="CIF10001",
        product_category=ProductCategory.OD.value,
        account_sub_type=AccountSubType.OVERDRAFT.value,
        product_code="OD-SME-001",
        branch_code="001",
        currency="USD",
        ledger_balance=Decimal("-500.00"),
        hold_amount=Decimal("0.00"),
        overdraft_limit=Decimal("10000.00"),
        status=AccountStatus.ACTIVE.value,
    )
    acc_partner = Account(
        account_number="ACC-10002-01",
        cif="CIF10002",
        product_category=ProductCategory.CASA.value,
        account_sub_type=AccountSubType.CURRENT.value,
        product_code="CASA-CUR-001",
        branch_code="001",
        currency="USD",
        ledger_balance=Decimal("3000.00"),
        hold_amount=Decimal("0.00"),
        overdraft_limit=Decimal("0.00"),
        status=AccountStatus.ACTIVE.value,
    )
    db.add_all([acc_current, acc_savings, acc_tda, acc_od, acc_partner])
    db.flush()

    hold = AccountHold(
        account_number="ACC-10001-01",
        amount=Decimal("200.00"),
        reason=HoldReason.LC_MARGIN.value,
        reference="LC-MARGIN-001",
        status=HoldStatus.ACTIVE.value,
        expires_at=datetime.now(timezone.utc) + timedelta(days=90),
    )
    db.add(hold)
    db.flush()

    seed_entries = [
        (acc_current, TxnCode.OPENING_BALANCE, DebitCredit.CREDIT, Decimal("5000.00"), week_ago, week_ago, "Opening balance"),
        (acc_savings, TxnCode.OPENING_BALANCE, DebitCredit.CREDIT, Decimal("12000.00"), week_ago, week_ago, "Opening balance"),
        (acc_tda, TxnCode.OPENING_BALANCE, DebitCredit.CREDIT, Decimal("50000.00"), week_ago, week_ago, "Term deposit opening"),
        (acc_od, TxnCode.OPENING_BALANCE, DebitCredit.DEBIT, Decimal("500.00"), week_ago, week_ago, "OD facility drawdown"),
        (acc_partner, TxnCode.OPENING_BALANCE, DebitCredit.CREDIT, Decimal("3000.00"), week_ago, week_ago, "Opening balance"),
        (acc_current, TxnCode.HOLD_PLACE, DebitCredit.DEBIT, Decimal("200.00"), yesterday, yesterday, "LC margin hold placed"),
        (acc_savings, TxnCode.INTEREST, DebitCredit.CREDIT, Decimal("15.50"), yesterday, yesterday, "Monthly interest credit"),
        (acc_current, TxnCode.FEE, DebitCredit.DEBIT, Decimal("5.00"), today, today, "Account maintenance fee"),
    ]

    for account, txn_code, dc, amount, vd, bd, narration in seed_entries:
        post_ledger_entry(
            db,
            account,
            txn_code=txn_code,
            debit_credit=dc,
            amount=amount,
            reference=f"SEED-{account.account_number}",
            narration=narration,
            value_date=vd,
            booking_date=bd,
        )

    db.commit()

    return {
        "message": "Demo data seeded successfully",
        "customers": 2,
        "accounts": 5,
        "holds": 1,
        "transactions": len(seed_entries),
        "sample_cif": "CIF10001",
        "sample_accounts": [
            "ACC-10001-01",
            "ACC-10001-02",
            "ACC-10001-03",
            "ACC-10001-04",
        ],
    }
