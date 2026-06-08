from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Index, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Account(Base):
    __tablename__ = "accounts"
    __table_args__ = (Index("ix_accounts_cif", "cif"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    account_number: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    cif: Mapped[str] = mapped_column(String(32), nullable=False)
    product_category: Mapped[str] = mapped_column(String(32), nullable=False)
    account_sub_type: Mapped[str] = mapped_column(String(32), nullable=False)
    product_code: Mapped[str] = mapped_column(String(64), nullable=False)
    branch_code: Mapped[str] = mapped_column(String(16), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="USD")
    ledger_balance: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    hold_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    overdraft_limit: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
