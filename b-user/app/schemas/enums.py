from enum import StrEnum


class BankStaffRole(StrEnum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    RETAIL = "retail"


class StaffStatus(StrEnum):
    ACTIVE = "active"
    DISABLED = "disabled"


BANK_STAFF_ROLES = frozenset(BankStaffRole)
