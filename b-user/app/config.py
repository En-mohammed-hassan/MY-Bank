from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg2://bank:bank@localhost:5432/bank_users"
    app_port: int = 8002

    # Public URL — must match JWT iss claim (e.g. https://auth.dental-care.me)
    keycloak_server_url: str = "http://localhost:8080"
    # Optional internal URL for pod → Keycloak on Docker host (e.g. http://host.k3s.internal:8080)
    keycloak_internal_url: str | None = None
    keycloak_realm: str = "bank"
    keycloak_admin_client_id: str = "bank-user-service"
    keycloak_admin_client_secret: str = "change-me"

    keycloak_public_client_id: str = "bank-web"
    keycloak_public_client_secret: str | None = None

    keycloak_jwks_url: str = "http://localhost:8080/realms/bank/protocol/openid-connect/certs"
    # Optional. bank-web tokens use aud=account by default.
    keycloak_audience: str | None = None

    @property
    def keycloak_issuer(self) -> str:
        return f"{self.keycloak_server_url.rstrip('/')}/realms/{self.keycloak_realm}"

    @property
    def keycloak_api_url(self) -> str:
        """Server-side Keycloak URL (admin API, login proxy)."""
        base = self.keycloak_internal_url or self.keycloak_server_url
        return base.rstrip("/")

    @property
    def keycloak_admin_base_url(self) -> str:
        return f"{self.keycloak_api_url}/admin/realms/{self.keycloak_realm}"

    @property
    def keycloak_token_url(self) -> str:
        return f"{self.keycloak_api_url}/realms/{self.keycloak_realm}/protocol/openid-connect/token"

    @property
    def keycloak_logout_url(self) -> str:
        return f"{self.keycloak_api_url}/realms/{self.keycloak_realm}/protocol/openid-connect/logout"


settings = Settings()
