from enum import StrEnum


class CustomerType(StrEnum):
    RETAIL = "RETAIL"
    SME = "SME"
    CORPORATE = "CORPORATE"


class CustomerStatus(StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    BLOCKED = "BLOCKED"


class ProductCategory(StrEnum):
    CASA = "CASA"
    TDA = "TDA"
    OD = "OD"
    LOAN = "LOAN"


class AccountSubType(StrEnum):
    CURRENT = "CURRENT"
    SAVINGS = "SAVINGS"
    OVERDRAFT = "OVERDRAFT"
    TERM_DEPOSIT = "TERM_DEPOSIT"
    LOAN = "LOAN"


class AccountStatus(StrEnum):
    ACTIVE = "ACTIVE"
    DORMANT = "DORMANT"
    FROZEN = "FROZEN"
    CLOSED = "CLOSED"


class TxnCode(StrEnum):
    OPENING_BALANCE = "OPENING_BALANCE"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"
    HOLD_PLACE = "HOLD_PLACE"
    HOLD_RELEASE = "HOLD_RELEASE"
    INTEREST = "INTEREST"
    FEE = "FEE"


class TransferStatus(StrEnum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class HoldReason(StrEnum):
    LC_MARGIN = "LC_MARGIN"
    PENDING_TRANSFER = "PENDING_TRANSFER"
    COMPLIANCE = "COMPLIANCE"
    MANUAL = "MANUAL"


class HoldStatus(StrEnum):
    ACTIVE = "ACTIVE"
    RELEASED = "RELEASED"
    EXPIRED = "EXPIRED"


class DebitCredit(StrEnum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"


class TransferSimulateMode(StrEnum):
    AUTO = "auto"
    SUCCESS = "success"
    INSUFFICIENT_FUNDS = "insufficient_funds"
    PENDING = "pending"
    FAILED = "failed"


class BankStaffRole(StrEnum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    RETAIL = "retail"


class CustomerPortalRole(StrEnum):
    EDITOR = "editor"
    VIEWER = "viewer"
