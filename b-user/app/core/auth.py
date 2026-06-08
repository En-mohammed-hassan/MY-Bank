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
from app.schemas.enums import BankStaffRole

_bearer = HTTPBearer(auto_error=True)

_jwks_cache: dict[str, Any] | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL_SECONDS = 300


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
        options = {"verify_aud": bool(settings.keycloak_audience)}
        decode_kwargs: dict[str, Any] = {
            "algorithms": [key.get("alg", "RS256")],
            "issuer": settings.keycloak_issuer,
            "options": options,
        }
        if settings.keycloak_audience:
            decode_kwargs["audience"] = settings.keycloak_audience

        return jwt.decode(token, rsa_key, **decode_kwargs)
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
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> AuthenticatedUser:
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


def require_roles(*allowed_roles: BankStaffRole):
    allowed = {role.value for role in allowed_roles}

    def _dependency(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if not user.roles.intersection(allowed):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _dependency
