import time
from typing import Any
from uuid import UUID

import httpx

from app.config import settings
from app.schemas.enums import CustomerRole

_CUSTOMER_ROLE_NAMES = {role.value for role in CustomerRole}


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

        response = client.post(
            settings.keycloak_token_url,
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

    def _resolve_created_user_id(
        self, client: httpx.Client, response: httpx.Response, username: str
    ) -> UUID:
        location = response.headers.get("Location", "")
        if location:
            candidate = location.rstrip("/").split("/")[-1]
            try:
                return UUID(candidate)
            except ValueError:
                pass

        lookup = client.get(
            f"{settings.keycloak_admin_base_url}/users",
            params={"username": username, "exact": "true"},
            headers=self._auth_headers(client),
        )
        if lookup.status_code != 200:
            raise KeycloakError(
                f"User created but ID lookup failed: {lookup.text}",
                status_code=lookup.status_code,
            )
        users = lookup.json()
        if not users:
            raise KeycloakError(
                "User created but Keycloak returned no Location header and username lookup was empty",
                status_code=500,
            )
        return UUID(users[0]["id"])

    def create_user(
        self,
        *,
        username: str,
        email: str,
        full_name: str,
        temporary_password: str,
        role: CustomerRole,
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

            user_id = self._resolve_created_user_id(client, response, username)
            try:
                self._set_customer_realm_role(client, user_id, role)
            except KeycloakError:
                try:
                    self.delete_user(user_id)
                except KeycloakError:
                    pass
                raise
            return user_id

    def _role_mapping_payload(self, role_rep: dict[str, Any]) -> dict[str, Any]:
        role_id = role_rep.get("id")
        role_name = role_rep.get("name")
        if not role_id or not role_name:
            raise KeycloakError(
                f"Invalid realm role representation for '{role_rep}': missing id or name",
                status_code=500,
            )
        return {
            "id": str(role_id),
            "name": str(role_name),
            "composite": bool(role_rep.get("composite", False)),
            "clientRole": False,
        }

    def _verify_realm_role_assigned(
        self, client: httpx.Client, user_id: UUID, role_name: str
    ) -> None:
        assigned = self._get_user_realm_roles(client, user_id)
        if any(r.get("name") == role_name for r in assigned):
            return
        raise KeycloakError(
            f"Realm role '{role_name}' was not assigned to user {user_id}",
            status_code=500,
        )

    def assign_realm_role(self, client: httpx.Client, user_id: UUID, role: CustomerRole) -> None:
        role_rep = self._get_realm_role(client, role.value)
        payload = self._role_mapping_payload(role_rep)
        response = client.post(
            f"{settings.keycloak_admin_base_url}/users/{user_id}/role-mappings/realm",
            json=[payload],
            headers=self._auth_headers(client),
        )
        if response.status_code not in (204, 200):
            raise KeycloakError(
                f"Failed to assign realm role: {response.text}",
                status_code=response.status_code,
            )
        self._verify_realm_role_assigned(client, user_id, role.value)

    def _set_customer_realm_role(
        self, client: httpx.Client, user_id: UUID, role: CustomerRole
    ) -> None:
        current_roles = self._get_user_realm_roles(client, user_id)
        customer_roles = [r for r in current_roles if r.get("name") in _CUSTOMER_ROLE_NAMES]

        if customer_roles:
            response = client.request(
                "DELETE",
                f"{settings.keycloak_admin_base_url}/users/{user_id}/role-mappings/realm",
                json=customer_roles,
                headers=self._auth_headers(client),
            )
            if response.status_code not in (204, 200):
                raise KeycloakError(
                    f"Failed to remove old realm roles: {response.text}",
                    status_code=response.status_code,
                )

        self.assign_realm_role(client, user_id, role)

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
