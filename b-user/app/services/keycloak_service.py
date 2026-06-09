import time
from typing import Any
from uuid import UUID

import httpx

from app.config import settings
from app.schemas.enums import BankStaffRole


class KeycloakError(Exception):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class KeycloakService:
    def __init__(self) -> None:
        self._access_token: str | None = None
        self._token_expires_at: float = 0.0

    def _ensure_token(self, client: httpx.Client) -> str:
        if self._access_token and time.time() < self._token_expires_at - 30:
            return self._access_token

        token_url = settings.keycloak_token_url
        response = client.post(
            token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": settings.keycloak_admin_client_id,
                "client_secret": settings.keycloak_admin_client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if response.status_code != 200:
            raise KeycloakError(
                f"Failed to obtain Keycloak admin token: {response.text}",
                status_code=response.status_code,
            )

        payload = response.json()
        self._access_token = payload["access_token"]
        self._token_expires_at = time.time() + payload.get("expires_in", 300)
        return self._access_token

    def _auth_headers(self, client: httpx.Client) -> dict[str, str]:
        token = self._ensure_token(client)
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def create_user(
        self,
        *,
        username: str,
        email: str,
        full_name: str,
        temporary_password: str,
        role: BankStaffRole,
        enabled: bool = True,
    ) -> UUID:
        first_name, _, last_name = full_name.partition(" ")
        if not last_name:
            last_name = first_name

        body: dict[str, Any] = {
            "username": username,
            "email": email,
            "firstName": first_name,
            "lastName": last_name,
            "enabled": enabled,
            "emailVerified": True,
            "credentials": [
                {
                    "type": "password",
                    "value": temporary_password,
                    "temporary": True,
                }
            ],
        }

        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{settings.keycloak_admin_base_url}/users",
                json=body,
                headers=self._auth_headers(client),
            )
            if response.status_code == 409:
                raise KeycloakError("User already exists in Keycloak", status_code=409)
            if response.status_code != 201:
                raise KeycloakError(
                    f"Failed to create Keycloak user: {response.text}",
                    status_code=response.status_code,
                )

            location = response.headers.get("Location", "")
            user_id_str = location.rstrip("/").split("/")[-1]
            user_id = UUID(user_id_str)
            self.assign_realm_role(client, user_id, role)
            return user_id

    def assign_realm_role(self, client: httpx.Client, user_id: UUID, role: BankStaffRole) -> None:
        role_rep = self._get_realm_role(client, role.value)
        response = client.post(
            f"{settings.keycloak_admin_base_url}/users/{user_id}/role-mappings/realm",
            json=[role_rep],
            headers=self._auth_headers(client),
        )
        if response.status_code not in (204, 200):
            raise KeycloakError(
                f"Failed to assign realm role: {response.text}",
                status_code=response.status_code,
            )

    def replace_realm_role(self, user_id: UUID, new_role: BankStaffRole) -> None:
        with httpx.Client(timeout=30.0) as client:
            current_roles = self._get_user_realm_roles(client, user_id)
            staff_role_names = {role.value for role in BankStaffRole}
            staff_roles = [r for r in current_roles if r.get("name") in staff_role_names]

            if staff_roles:
                response = client.request(
                    "DELETE",
                    f"{settings.keycloak_admin_base_url}/users/{user_id}/role-mappings/realm",
                    json=staff_roles,
                    headers=self._auth_headers(client),
                )
                if response.status_code not in (204, 200):
                    raise KeycloakError(
                        f"Failed to remove old realm roles: {response.text}",
                        status_code=response.status_code,
                    )

            self.assign_realm_role(client, user_id, new_role)

    def set_user_enabled(self, user_id: UUID, enabled: bool) -> None:
        with httpx.Client(timeout=30.0) as client:
            response = client.put(
                f"{settings.keycloak_admin_base_url}/users/{user_id}",
                json={"enabled": enabled},
                headers=self._auth_headers(client),
            )
            if response.status_code != 204:
                raise KeycloakError(
                    f"Failed to update Keycloak user status: {response.text}",
                    status_code=response.status_code,
                )

    def delete_user(self, user_id: UUID) -> None:
        with httpx.Client(timeout=30.0) as client:
            response = client.delete(
                f"{settings.keycloak_admin_base_url}/users/{user_id}",
                headers=self._auth_headers(client),
            )
            if response.status_code not in (204, 404):
                raise KeycloakError(
                    f"Failed to delete Keycloak user: {response.text}",
                    status_code=response.status_code,
                )

    def _get_realm_role(self, client: httpx.Client, role_name: str) -> dict[str, Any]:
        response = client.get(
            f"{settings.keycloak_admin_base_url}/roles/{role_name}",
            headers=self._auth_headers(client),
        )
        if response.status_code != 200:
            raise KeycloakError(
                f"Realm role '{role_name}' not found: {response.text}",
                status_code=response.status_code,
            )
        return response.json()

    def _get_user_realm_roles(self, client: httpx.Client, user_id: UUID) -> list[dict[str, Any]]:
        response = client.get(
            f"{settings.keycloak_admin_base_url}/users/{user_id}/role-mappings/realm",
            headers=self._auth_headers(client),
        )
        if response.status_code != 200:
            raise KeycloakError(
                f"Failed to fetch user realm roles: {response.text}",
                status_code=response.status_code,
            )
        return response.json()


keycloak_service = KeycloakService()
