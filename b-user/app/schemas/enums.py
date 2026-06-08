from enum import StrEnum


class BankStaffRole(StrEnum):
    PLATFORM_ADMIN = "platform_admin"
    BANK_ADMIN = "bank_admin"
    BANK_SUPPORT = "bank_support"
    BANK_AUDITOR = "bank_auditor"
    RELATIONSHIP_MANAGER = "relationship_manager"


class StaffStatus(StrEnum):
    ACTIVE = "active"
    DISABLED = "disabled"


BANK_STAFF_ROLES = frozenset(BankStaffRole)
