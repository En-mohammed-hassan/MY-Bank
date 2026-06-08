from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg2://bank:bank@localhost:5432/bank_users"
    app_port: int = 8002

    keycloak_server_url: str = "http://localhost:8080"
    keycloak_realm: str = "bank"
    keycloak_admin_client_id: str = "bank-user-service"
    keycloak_admin_client_secret: str = "change-me"

    keycloak_jwks_url: str = "http://localhost:8080/realms/bank/protocol/openid-connect/certs"
    keycloak_audience: str | None = "bank-api"

    @property
    def keycloak_issuer(self) -> str:
        return f"{self.keycloak_server_url.rstrip('/')}/realms/{self.keycloak_realm}"

    @property
    def keycloak_admin_base_url(self) -> str:
        return f"{self.keycloak_server_url.rstrip('/')}/admin/realms/{self.keycloak_realm}"


settings = Settings()
