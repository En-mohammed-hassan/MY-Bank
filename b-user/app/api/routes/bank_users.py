from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.auth import AuthenticatedUser, require_roles
from app.schemas.bank_staff import (
    BankStaffCreateRequest,
    BankStaffListResponse,
    BankStaffResponse,
    BankStaffRoleUpdateRequest,
    BankStaffStatusUpdateRequest,
)
from app.schemas.enums import BankStaffRole, StaffStatus
from app.services.bank_staff_service import (
    StaffAlreadyExistsError,
    StaffNotFoundError,
    create_staff,
    delete_staff,
    get_staff_by_id,
    list_staff,
    update_staff_role,
    update_staff_status,
)
from app.services.keycloak_service import KeycloakError

router = APIRouter(prefix="/bank-users", tags=["bank-users"])


def _staff_response(staff) -> BankStaffResponse:
    return BankStaffResponse.model_validate(staff)


def _handle_keycloak_error(exc: KeycloakError) -> HTTPException:
    if exc.status_code == 409:
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.post("", response_model=BankStaffResponse, status_code=status.HTTP_201_CREATED)
def create_bank_user(
    payload: BankStaffCreateRequest,
    db: Session = Depends(get_db),
    _: AuthenticatedUser = Depends(require_roles(BankStaffRole.ADMIN, BankStaffRole.SUPERVISOR)),
) -> BankStaffResponse:
    try:
        staff = create_staff(db, payload)
        return _staff_response(staff)
    except StaffAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except KeycloakError as exc:
        raise _handle_keycloak_error(exc) from exc


@router.get("", response_model=BankStaffListResponse)
def list_bank_users(
    role: BankStaffRole | None = Query(default=None),
    status_filter: StaffStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _: AuthenticatedUser = Depends(
        require_roles(
            BankStaffRole.ADMIN,
            BankStaffRole.SUPERVISOR,
            BankStaffRole.RETAIL,
        )
    ),
) -> BankStaffListResponse:
    """List staff profiles stored in the app database (not every Keycloak user)."""
    staff_list = list_staff(db, role=role, status=status_filter)
    items = [_staff_response(staff) for staff in staff_list]
    return BankStaffListResponse(items=items, total=len(items))


@router.get("/{user_id}", response_model=BankStaffResponse)
def get_bank_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: AuthenticatedUser = Depends(
        require_roles(
            BankStaffRole.ADMIN,
            BankStaffRole.SUPERVISOR,
            BankStaffRole.RETAIL,
        )
    ),
) -> BankStaffResponse:
    try:
        staff = get_staff_by_id(db, user_id)
        return _staff_response(staff)
    except StaffNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{user_id}/role", response_model=BankStaffResponse)
def patch_bank_user_role(
    user_id: UUID,
    payload: BankStaffRoleUpdateRequest,
    db: Session = Depends(get_db),
    _: AuthenticatedUser = Depends(require_roles(BankStaffRole.ADMIN, BankStaffRole.SUPERVISOR)),
) -> BankStaffResponse:
    try:
        staff = update_staff_role(db, user_id, payload.role)
        return _staff_response(staff)
    except StaffNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except KeycloakError as exc:
        raise _handle_keycloak_error(exc) from exc


@router.patch("/{user_id}/status", response_model=BankStaffResponse)
def patch_bank_user_status(
    user_id: UUID,
    payload: BankStaffStatusUpdateRequest,
    db: Session = Depends(get_db),
    _: AuthenticatedUser = Depends(require_roles(BankStaffRole.ADMIN, BankStaffRole.SUPERVISOR)),
) -> BankStaffResponse:
    try:
        staff = update_staff_status(db, user_id, payload.status)
        return _staff_response(staff)
    except StaffNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except KeycloakError as exc:
        raise _handle_keycloak_error(exc) from exc


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bank_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: AuthenticatedUser = Depends(require_roles(BankStaffRole.ADMIN)),
) -> None:
    try:
        delete_staff(db, user_id)
    except StaffNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except KeycloakError as exc:
        raise _handle_keycloak_error(exc) from exc
