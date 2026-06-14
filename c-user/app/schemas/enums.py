from enum import StrEnum


class CustomerRole(StrEnum):
    EDITOR = "editor"
    VIEWER = "viewer"


class CustomerStatus(StrEnum):
    ACTIVE = "active"
    DISABLED = "disabled"


class StaffRole(StrEnum):
    """Staff roles allowed to manage customer accounts (same realm)."""

    ADMIN = "admin"
    SUPERVISOR = "supervisor"


# Keycloak may still assign pre-rename realm roles to staff users.
LEGACY_STAFF_ROLE_MAP: dict[str, str] = {
    "platform_admin": StaffRole.ADMIN.value,
    "bank_admin": StaffRole.ADMIN.value,
    "bank_support": StaffRole.SUPERVISOR.value,
    "bank_auditor": StaffRole.SUPERVISOR.value,
}


def normalize_staff_roles(roles: list[str]) -> frozenset[str]:
    staff_values = {role.value for role in StaffRole}
    normalized: set[str] = set()
    for role in roles:
        mapped = LEGACY_STAFF_ROLE_MAP.get(role, role)
        if mapped in staff_values:
            normalized.add(mapped)
    return frozenset(normalized)
