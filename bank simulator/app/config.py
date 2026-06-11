from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg2://core:core@localhost:5432/core_banking"
    app_port: int = 8001

    auth_disabled: bool = False

    keycloak_server_url: str = "http://localhost:8080"
    keycloak_realm: str = "bank"
    keycloak_public_client_id: str = "bank-web"
    keycloak_additional_client_ids: str = "customer-app"
    keycloak_jwks_url: str = "http://localhost:8080/realms/bank/protocol/openid-connect/certs"
    keycloak_audience: str | None = None

    @property
    def keycloak_issuer(self) -> str:
        return f"{self.keycloak_server_url.rstrip('/')}/realms/{self.keycloak_realm}"

    @property
    def keycloak_accepted_audiences(self) -> frozenset[str]:
        allowed = {self.keycloak_public_client_id, "account"}
        if self.keycloak_audience:
            allowed.add(self.keycloak_audience)
        for client_id in self.keycloak_additional_client_ids.split(","):
            client_id = client_id.strip()
            if client_id:
                allowed.add(client_id)
        return frozenset(allowed)


settings = Settings()
