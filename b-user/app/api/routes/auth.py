from fastapi import APIRouter

from app.schemas.auth import LoginRequest, LogoutRequest, LogoutResponse, RefreshRequest, TokenResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    """Proxy login to Keycloak (password grant). Returns access + refresh tokens."""
    return auth_service.login(username=payload.username, password=payload.password)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest) -> TokenResponse:
    """Exchange a refresh token for a new access token via Keycloak."""
    return auth_service.refresh(refresh_token=payload.refresh_token)


@router.post("/logout", response_model=LogoutResponse)
def logout(payload: LogoutRequest) -> LogoutResponse:
    """Invalidate the Keycloak session / refresh token."""
    return auth_service.logout(refresh_token=payload.refresh_token)
