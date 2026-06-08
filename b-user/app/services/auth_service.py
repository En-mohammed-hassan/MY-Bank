from typing import Any

import httpx
from fastapi import HTTPException, status

from app.config import settings
from app.schemas.auth import LogoutResponse, TokenResponse


class AuthService:
    @property
    def _token_url(self) -> str:
        return (
            f"{settings.keycloak_server_url.rstrip('/')}/realms/{settings.keycloak_realm}"
            "/protocol/openid-connect/token"
        )

    @property
    def _logout_url(self) -> str:
        return (
            f"{settings.keycloak_server_url.rstrip('/')}/realms/{settings.keycloak_realm}"
            "/protocol/openid-connect/logout"
        )

    def _public_client_data(self) -> dict[str, str]:
        data = {"client_id": settings.keycloak_public_client_id}
        if settings.keycloak_public_client_secret:
            data["client_secret"] = settings.keycloak_public_client_secret
        return data

    def _raise_keycloak_error(self, response: httpx.Response) -> None:
        try:
            detail: Any = response.json()
        except ValueError:
            detail = response.text or "Keycloak request failed"

        status_code = status.HTTP_401_UNAUTHORIZED
        if response.status_code >= 500:
            status_code = status.HTTP_502_BAD_GATEWAY
        elif response.status_code == 400:
            status_code = status.HTTP_400_BAD_REQUEST

        raise HTTPException(status_code=status_code, detail=detail)

    def login(self, *, username: str, password: str) -> TokenResponse:
        data = {
            **self._public_client_data(),
            "grant_type": "password",
            "username": username,
            "password": password,
        }
        return self._request_tokens(data)

    def refresh(self, *, refresh_token: str) -> TokenResponse:
        data = {
            **self._public_client_data(),
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }
        return self._request_tokens(data)

    def logout(self, *, refresh_token: str) -> LogoutResponse:
        data = {
            **self._public_client_data(),
            "refresh_token": refresh_token,
        }
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                self._logout_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if response.status_code not in (204, 200):
                self._raise_keycloak_error(response)
        return LogoutResponse()

    def _request_tokens(self, data: dict[str, str]) -> TokenResponse:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                self._token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if response.status_code != 200:
                self._raise_keycloak_error(response)
            return TokenResponse.model_validate(response.json())


auth_service = AuthService()
