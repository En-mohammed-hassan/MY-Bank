from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg2://bank:bank@localhost:5432/bank_customers"
    app_port: int = 8003

    keycloak_server_url: str = "http://localhost:8080"
    keycloak_internal_url: str | None = None
    keycloak_realm: str = "bank"
    keycloak_admin_client_id: str = "customer-service"
    keycloak_admin_client_secret: str = "change-me"

    keycloak_public_client_id: str = "customer-app"
    keycloak_public_client_secret: str | None = None

    keycloak_jwks_url: str = "http://localhost:8080/realms/bank/protocol/openid-connect/certs"
    keycloak_audience: str | None = None

    cors_origins: str = "*"
    cors_allow_credentials: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def keycloak_issuer(self) -> str:
        return f"{self.keycloak_server_url.rstrip('/')}/realms/{self.keycloak_realm}"

    @property
    def keycloak_api_url(self) -> str:
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
