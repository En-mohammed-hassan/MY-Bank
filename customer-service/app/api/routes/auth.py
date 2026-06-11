from fastapi import APIRouter

from app.schemas.auth import LoginRequest, LogoutRequest, LogoutResponse, RefreshRequest, TokenResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    return auth_service.login(username=payload.username, password=payload.password)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest) -> TokenResponse:
    return auth_service.refresh(refresh_token=payload.refresh_token)


@router.post("/logout", response_model=LogoutResponse)
def logout(payload: LogoutRequest) -> LogoutResponse:
    return auth_service.logout(refresh_token=payload.refresh_token)
