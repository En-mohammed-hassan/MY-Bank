from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.customer_profile import CustomerProfile
from app.schemas.customer import CustomerCreateRequest, CustomerSelfUpdateRequest
from app.schemas.enums import CustomerStatus
from app.services.keycloak_service import KeycloakError, keycloak_service


class CustomerNotFoundError(Exception):
    pass


class CustomerAlreadyExistsError(Exception):
    pass


def get_customer_by_id(db: Session, customer_id: UUID) -> CustomerProfile:
    row = db.query(CustomerProfile).filter(CustomerProfile.id == customer_id).first()
    if not row:
        raise CustomerNotFoundError(f"Customer {customer_id} not found")
    return row


def get_customer_by_keycloak_id(db: Session, keycloak_user_id: UUID) -> CustomerProfile:
    row = (
        db.query(CustomerProfile)
        .filter(CustomerProfile.keycloak_user_id == keycloak_user_id)
        .first()
    )
    if not row:
        raise CustomerNotFoundError("Customer profile not found")
    return row


def list_customers(db: Session) -> list[CustomerProfile]:
    return db.query(CustomerProfile).order_by(CustomerProfile.created_at.desc()).all()


def create_customer(db: Session, payload: CustomerCreateRequest) -> CustomerProfile:
    existing = (
        db.query(CustomerProfile)
        .filter(
            (CustomerProfile.email == str(payload.email))
            | (CustomerProfile.username == payload.username)
        )
        .first()
    )
    if existing:
        raise CustomerAlreadyExistsError("Customer with this email or username already exists")

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

        profile = CustomerProfile(
            keycloak_user_id=keycloak_user_id,
            username=payload.username,
            email=str(payload.email),
            full_name=payload.full_name,
            cif=payload.cif,
            role=payload.role.value,
            status=CustomerStatus.ACTIVE.value,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
    except IntegrityError as exc:
        db.rollback()
        if keycloak_user_id is not None:
            try:
                keycloak_service.delete_user(keycloak_user_id)
            except KeycloakError:
                pass
        raise CustomerAlreadyExistsError(
            "Customer with this email or username already exists"
        ) from exc
    except KeycloakError:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        if keycloak_user_id is not None:
            try:
                keycloak_service.delete_user(keycloak_user_id)
            except KeycloakError:
                pass
        raise


def update_customer_self(
    db: Session, keycloak_user_id: UUID, payload: CustomerSelfUpdateRequest
) -> CustomerProfile:
    profile = get_customer_by_keycloak_id(db, keycloak_user_id)
    if payload.full_name is not None:
        profile.full_name = payload.full_name
    db.commit()
    db.refresh(profile)
    return profile
