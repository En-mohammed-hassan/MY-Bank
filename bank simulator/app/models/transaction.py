from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (Index("ix_transactions_account_number", "account_number"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    account_number: Mapped[str] = mapped_column(String(32), nullable=False)
    txn_code: Mapped[str] = mapped_column(String(32), nullable=False)
    debit_credit: Mapped[str] = mapped_column(String(8), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    ledger_balance_after: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    available_balance_after: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(128), nullable=True)
    narration: Mapped[str | None] = mapped_column(String(512), nullable=True)
    value_date: Mapped[date] = mapped_column(Date, nullable=False)
    booking_date: Mapped[date] = mapped_column(Date, nullable=False)
    transfer_id: Mapped[int | None] = mapped_column(ForeignKey("transfer_requests.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    transfer: Mapped["TransferRequest | None"] = relationship(
        "TransferRequest",
        back_populates="ledger_entries",
        foreign_keys=[transfer_id],
    )
