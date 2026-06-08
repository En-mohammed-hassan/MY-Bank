from uuid import UUID

from sqlalchemy.orm import Session

from app.models.bank_staff import BankStaff
from app.schemas.bank_staff import BankStaffCreateRequest
from app.schemas.enums import BankStaffRole, StaffStatus
from app.services.keycloak_service import KeycloakError, keycloak_service


class StaffNotFoundError(Exception):
    pass


class StaffAlreadyExistsError(Exception):
    pass


def get_staff_by_id(db: Session, user_id: UUID) -> BankStaff:
    staff = db.query(BankStaff).filter(BankStaff.id == user_id).first()
    if not staff:
        raise StaffNotFoundError(f"Bank staff user {user_id} not found")
    return staff


def list_staff(
    db: Session,
    *,
    role: BankStaffRole | None = None,
    status: StaffStatus | None = None,
) -> list[BankStaff]:
    query = db.query(BankStaff).order_by(BankStaff.created_at.desc())
    if role is not None:
        query = query.filter(BankStaff.role == role.value)
    if status is not None:
        query = query.filter(BankStaff.status == status.value)
    return query.all()


def create_staff(db: Session, payload: BankStaffCreateRequest) -> BankStaff:
    existing = (
        db.query(BankStaff)
        .filter((BankStaff.email == payload.email) | (BankStaff.username == payload.username))
        .first()
    )
    if existing:
        raise StaffAlreadyExistsError("Staff user with this email or username already exists")

    keycloak_user_id: UUID | None = None
    try:
        keycloak_user_id = keycloak_service.create_user(
            username=payload.username,
            email=str(payload.email),
            full_name=payload.full_name,
            temporary_password=payload.temporary_password,
            role=payload.role,
            enabled=True,
        )

        staff = BankStaff(
            keycloak_user_id=keycloak_user_id,
            username=payload.username,
            email=str(payload.email),
            full_name=payload.full_name,
            role=payload.role.value,
            status=StaffStatus.ACTIVE.value,
            department=payload.department,
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)
        return staff
    except Exception:
        db.rollback()
        if keycloak_user_id is not None:
            try:
                keycloak_service.delete_user(keycloak_user_id)
            except KeycloakError:
                pass
        raise


def update_staff_role(db: Session, user_id: UUID, role: BankStaffRole) -> BankStaff:
    staff = get_staff_by_id(db, user_id)
    if staff.role == role.value:
        return staff

    keycloak_service.replace_realm_role(staff.keycloak_user_id, role)
    staff.role = role.value
    db.commit()
    db.refresh(staff)
    return staff


def update_staff_status(db: Session, user_id: UUID, status: StaffStatus) -> BankStaff:
    staff = get_staff_by_id(db, user_id)
    if staff.status == status.value:
        return staff

    enabled = status == StaffStatus.ACTIVE
    keycloak_service.set_user_enabled(staff.keycloak_user_id, enabled)
    staff.status = status.value
    db.commit()
    db.refresh(staff)
    return staff


def delete_staff(db: Session, user_id: UUID) -> None:
    staff = get_staff_by_id(db, user_id)
    keycloak_user_id = staff.keycloak_user_id
    staff_snapshot = {
        "keycloak_user_id": staff.keycloak_user_id,
        "username": staff.username,
        "email": staff.email,
        "full_name": staff.full_name,
        "role": staff.role,
        "status": staff.status,
        "department": staff.department,
    }

    db.delete(staff)
    db.commit()

    try:
        keycloak_service.delete_user(keycloak_user_id)
    except KeycloakError:
        rollback_staff = BankStaff(
            id=user_id,
            keycloak_user_id=staff_snapshot["keycloak_user_id"],
            username=staff_snapshot["username"],
            email=staff_snapshot["email"],
            full_name=staff_snapshot["full_name"],
            role=staff_snapshot["role"],
            status=staff_snapshot["status"],
            department=staff_snapshot["department"],
        )
        db.add(rollback_staff)
        db.commit()
        raise
