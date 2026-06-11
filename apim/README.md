# WSO2 API Manager (MY-Bank)

> **Redeploy checklist (Keycloak + WSO2 + tunnel):** [`platform/docker-platform-deploy.md`](../platform/docker-platform-deploy.md)

WSO2 APIM runs **outside** the k3s cluster (same pattern as Keycloak). It is the public entry point at `api.dental-care.me`; backend services stay on `core-api.dental-care.me` and `users-api.dental-care.me`.

## Architecture

```
Clients (Postman / web app)
        |
        | HTTPS + Bearer JWT (Keycloak)
        v
  WSO2 API Gateway  (api.dental-care.me / localhost:8243)
        |
        +-- /core-banking/1.0.0/*  -->  https://core-api.dental-care.me
        |
        +-- /bank-user/1.0.0/*       -->  https://users-api.dental-care.me
```

OpenAPI specs for import live in `apim/apis/`.

## 1. Start WSO2 locally

```bash
cd apim/wso2
cp .env.example .env   # optional — documents hostnames/backends
docker compose up -d
```

First startup can take 2–3 minutes. Wait until the health check passes:

```bash
docker compose ps
```

| Port | Purpose |
|------|---------|
| 9443 | Publisher / DevPortal / Carbon (HTTPS) |
| 8243 | API Gateway HTTPS |
| 8280 | API Gateway HTTP |

Default admin: **admin / admin**

Publisher UI: https://localhost:9443/publisher (accept self-signed cert)

## 2. Configure hostnames (production)

Edit `apim/wso2/conf/deployment.toml`:

- `[server].hostname` → `apim.dental-care.me` (Publisher / OAuth — not `api.*`)
- `[[apim.gateway.environment]]` → `http_endpoint` / `https_endpoint` on `api.dental-care.me`

Restart: `docker compose restart`

## 3. Import APIs (Publisher UI)

1. Open https://localhost:9443/publisher → sign in as `admin`
2. **Create API** → **Import OpenAPI**
3. Import `apim/apis/core-banking.openapi.yaml`
   - Name: `Core Banking`
   - Context: `/core-banking`
   - Version: `1.0.0`
   - Endpoint: `https://core-api.dental-care.me` (or `http://host.docker.internal:8001` for local backends)
4. Repeat for `apim/apis/bank-user.openapi.yaml`
   - Context: `/bank-user`
   - Endpoint: `https://users-api.dental-care.me` (or `http://host.docker.internal:8002`)

Publish both APIs to the **Default** gateway environment.

## 4. OAuth2 with Keycloak (external authorization server)

### Keycloak client

In realm `bank`, create (or reuse) client `bank-api`:

- Client authentication: **ON** (confidential) for machine clients, or use existing `bank-web` for password grant testing
- Valid redirect URIs: `https://localhost:9443/*`, `https://api.dental-care.me/*`
- Direct access grants: **ON** (dev/testing)

### Publisher — API security

For each API (or per-resource):

1. **API Configurations** → **Resources** → select endpoints needing auth
2. **Security** → enable **OAuth2**
3. **API Configurations** → **Runtime** → **Key Managers** → **Add**
4. Choose **Custom OAuth provider** / external Keycloak:
   - Token URL: `https://auth.dental-care.me/realms/bank/protocol/openid-connect/token`
   - Revoke URL: `https://auth.dental-care.me/realms/bank/protocol/openid-connect/revoke`
   - JWKS URL: `https://auth.dental-care.me/realms/bank/protocol/openid-connect/certs`
   - Issuer: `https://auth.dental-care.me/realms/bank`

Mark `/health` and `/auth/*` as **unsecured** on the bank-user API. Mark `/health` as unsecured on core-banking.

The gateway forwards the `Authorization: Bearer` header to backends unchanged.

## 5. Rate limiting policies

Create subscription-level or resource-level throttling in Publisher:

| API | Resource | Suggested policy |
|-----|----------|------------------|
| Bank User | `POST /auth/login` | 10 req/min per IP (burst 5) |
| Core Banking | `POST /core/transfers/internal` | 30 req/min per subscription |

Steps:

1. **Governance** → **Policies** → create **Rate Limiting** policy
2. Attach to the API → **Resources** → **Operation Policies** (request flow)

## 6. Test via gateway

### Get a token (Keycloak)

```bash
curl -sk -X POST "https://auth.dental-care.me/realms/bank/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=bank-web" \
  -d "username=admin" \
  -d "password=YOUR_PASSWORD"
```

### Call through gateway (local)

```bash
# Health (no auth)
curl -sk https://localhost:8243/core-banking/1.0.0/health

# Authenticated core call
curl -sk https://localhost:8243/core-banking/1.0.0/core/customers/CIF10001 \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Login via bank-user BFF
curl -sk -X POST https://localhost:8243/bank-user/1.0.0/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}'
```

Production: replace host with `https://api.dental-care.me`.

## 7. Postman

Import `postman/MY-Bank.postman_collection.json` and `postman/MY-Bank-Remote.postman_environment.json`.

Set `api_gateway_base_url` to:

- Local: `https://localhost:8243`
- Remote: `https://api.dental-care.me`

Use the **API Gateway** folder in the collection (paths include `/core-banking/1.0.0` and `/bank-user/1.0.0` prefixes).

## Files

```
apim/
├── README.md
├── apis/
│   ├── core-banking.openapi.yaml
│   └── bank-user.openapi.yaml
└── wso2/
    ├── docker-compose.yml
    ├── .env.example
    └── conf/deployment.toml
```
