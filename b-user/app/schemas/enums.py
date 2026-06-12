from enum import StrEnum


class BankStaffRole(StrEnum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    RETAIL = "retail"


class StaffStatus(StrEnum):
    ACTIVE = "active"
    DISABLED = "disabled"


BANK_STAFF_ROLES = frozenset(BankStaffRole)

# Rows created before role rename may still store old values.
LEGACY_STAFF_ROLE_MAP: dict[str, str] = {
    "platform_admin": BankStaffRole.ADMIN.value,
    "bank_admin": BankStaffRole.ADMIN.value,
    "bank_support": BankStaffRole.SUPERVISOR.value,
    "bank_auditor": BankStaffRole.SUPERVISOR.value,
    "relationship_manager": BankStaffRole.RETAIL.value,
}


def normalize_staff_role(value: str) -> BankStaffRole:
    mapped = LEGACY_STAFF_ROLE_MAP.get(value, value)
    try:
        return BankStaffRole(mapped)
    except ValueError:
        return BankStaffRole.RETAIL
