import time
from dataclasses import dataclass
from typing import Any
from uuid import UUID

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt
from jose.exceptions import ExpiredSignatureError

from app.config import settings

_bearer = HTTPBearer(auto_error=False)

_jwks_cache: dict[str, Any] | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL_SECONDS = 300

_ADMIN_ROLES = frozenset({"platform_admin", "bank_admin"})


@dataclass(frozen=True)
class AuthenticatedUser:
    keycloak_user_id: UUID
    username: str | None
    email: str | None
    roles: frozenset[str]


def _fetch_jwks() -> dict[str, Any]:
    global _jwks_cache, _jwks_fetched_at

    if _jwks_cache and time.time() - _jwks_fetched_at < _JWKS_TTL_SECONDS:
        return _jwks_cache

    response = httpx.get(settings.keycloak_jwks_url, timeout=10.0)
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch Keycloak JWKS",
        )

    _jwks_cache = response.json()
    _jwks_fetched_at = time.time()
    return _jwks_cache


def _token_audiences(claims: dict[str, Any]) -> frozenset[str]:
    aud = claims.get("aud")
    if aud is None:
        return frozenset()
    if isinstance(aud, str):
        return frozenset({aud})
    return frozenset(aud)


def _validate_token_audience(claims: dict[str, Any]) -> None:
    audiences = _token_audiences(claims)
    allowed = {settings.keycloak_public_client_id, "account"}
    if settings.keycloak_audience:
        allowed.add(settings.keycloak_audience)

    if audiences and not audiences.intersection(allowed):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience",
        )


def _decode_token(token: str) -> dict[str, Any]:
    try:
        jwks = _fetch_jwks()
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token signing key",
            )

        rsa_key = jwk.construct(key)
        decode_kwargs: dict[str, Any] = {
            "algorithms": [key.get("alg", "RS256")],
            "issuer": settings.keycloak_issuer,
            "options": {"verify_aud": False},
        }
        claims = jwt.decode(token, rsa_key, **decode_kwargs)
        _validate_token_audience(claims)
        return claims
    except ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        ) from exc
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        ) from exc


def _extract_roles(claims: dict[str, Any]) -> frozenset[str]:
    realm_roles = claims.get("realm_access", {}).get("roles", [])
    return frozenset(realm_roles)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> AuthenticatedUser:
    if settings.auth_disabled:
        return AuthenticatedUser(
            keycloak_user_id=UUID("00000000-0000-0000-0000-000000000000"),
            username="auth-disabled",
            email=None,
            roles=_ADMIN_ROLES,
        )

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    claims = _decode_token(credentials.credentials)
    sub = claims.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject",
        )

    return AuthenticatedUser(
        keycloak_user_id=UUID(sub),
        username=claims.get("preferred_username"),
        email=claims.get("email"),
        roles=_extract_roles(claims),
    )


def require_authenticated(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    return user


def require_roles(*allowed_roles: str):
    allowed = frozenset(role.value if hasattr(role, "value") else role for role in allowed_roles)

    def _dependency(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if settings.auth_disabled:
            return user
        if not user.roles.intersection(allowed):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _dependency
