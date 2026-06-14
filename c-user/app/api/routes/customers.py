from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.auth import AuthenticatedUser, get_current_user, require_customer_roles, require_staff_roles
from app.schemas.customer import (
    CustomerCreateRequest,
    CustomerListResponse,
    CustomerResponse,
    CustomerSelfUpdateRequest,
)
from app.schemas.enums import CustomerRole, StaffRole, normalize_staff_roles
from app.services.customer_profile_service import (
    CustomerAlreadyExistsError,
    CustomerNotFoundError,
    create_customer,
    get_customer_by_id,
    get_customer_by_keycloak_id,
    list_customers,
    update_customer_self,
)
from app.services.keycloak_service import KeycloakError

router = APIRouter(prefix="/customers", tags=["customers"])


def _response(row) -> CustomerResponse:
    return CustomerResponse.model_validate(row)


def _keycloak_http_error(exc: KeycloakError) -> HTTPException:
    if exc.status_code == 409:
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer_user(
    payload: CustomerCreateRequest,
    db: Session = Depends(get_db),
    _: AuthenticatedUser = Depends(require_staff_roles(StaffRole.ADMIN, StaffRole.SUPERVISOR)),
) -> CustomerResponse:
    """Staff creates a retail customer login (Keycloak + DB)."""
    try:
        return _response(create_customer(db, payload))
    except CustomerAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except KeycloakError as exc:
        raise _keycloak_http_error(exc) from exc


@router.get("", response_model=CustomerListResponse)
def list_customer_users(
    db: Session = Depends(get_db),
    _: AuthenticatedUser = Depends(require_staff_roles(StaffRole.ADMIN, StaffRole.SUPERVISOR)),
) -> CustomerListResponse:
    items = [_response(c) for c in list_customers(db)]
    return CustomerListResponse(items=items, total=len(items))


@router.get("/me", response_model=CustomerResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(
        require_customer_roles(CustomerRole.EDITOR, CustomerRole.VIEWER)
    ),
) -> CustomerResponse:
    try:
        return _response(get_customer_by_keycloak_id(db, user.keycloak_user_id))
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/me", response_model=CustomerResponse)
def update_my_profile(
    payload: CustomerSelfUpdateRequest,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_customer_roles(CustomerRole.EDITOR)),
) -> CustomerResponse:
    try:
        return _response(update_customer_self(db, user.keycloak_user_id, payload))
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: UUID,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> CustomerResponse:
    try:
        profile = get_customer_by_id(db, customer_id)
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    staff_ok = normalize_staff_roles(list(user.roles)).intersection(
        {StaffRole.ADMIN.value, StaffRole.SUPERVISOR.value}
    )
    self_ok = profile.keycloak_user_id == user.keycloak_user_id
    if not staff_ok and not self_ok:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    return _response(profile)
