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
