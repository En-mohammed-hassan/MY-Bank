from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg2://core:core@localhost:5432/core_banking"
    app_port: int = 8001

    auth_disabled: bool = False

    keycloak_server_url: str = "http://localhost:8080"
    keycloak_realm: str = "bank"
    keycloak_public_client_id: str = "bank-web"
    keycloak_jwks_url: str = "http://localhost:8080/realms/bank/protocol/openid-connect/certs"
    keycloak_audience: str | None = None

    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def keycloak_issuer(self) -> str:
        return f"{self.keycloak_server_url.rstrip('/')}/realms/{self.keycloak_realm}"


settings = Settings()
