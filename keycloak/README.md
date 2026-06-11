# Keycloak (MY-Bank platform IdP)

Keycloak runs **outside Kubernetes**, like WSO2 APIM (`apim/wso2/`).  
MY-Bank microservices in k8s connect to it via `KEYCLOAK_*` secrets.

## What your old server compose contained

Your previous `docker-compose.yml` had **three** services:

| Service | Purpose | In this repo? |
|---------|---------|---------------|
| **postgres** | Database for `account-service` (old app) | **No** — k8s has its own Postgres for `core-banking` / `bank-user` |
| **keycloak** | Login, JWT, realm `bank`, clients | **Yes** — this folder |
| **account-service** | Old custom API (replaced by `b-user/`) | **No** — use `b-user` in k8s instead |

This folder is **Keycloak only**.

## Quick start

```bash
cd keycloak
cp .env.example .env
# Edit .env — set KEYCLOAK_ADMIN_PASSWORD and KC_HOSTNAME

docker compose up -d
```

| URL | Purpose |
|-----|---------|
| `http://localhost:8080` | Admin console (local) |
| `https://auth.dental-care.me` | Public URL (via Cloudflare Tunnel) |

Default admin (from `.env`): `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`

## Realm and clients (MY-Bank)

After first login, create/configure:

1. **Realm:** `bank`
2. **Clients:**
   - `bank-user-service` — confidential (Admin API for `b-user`)
   - `bank-web` — public (login / Postman)
   - `bank-api` — optional (WSO2 gateway audience)
3. **Realm roles:** `platform_admin`, `bank_admin`, `bank_support`, `bank_auditor`, `relationship_manager`

Full steps: [`b-user/README.md`](../b-user/README.md)

## Wire k8s apps to this Keycloak

Update secrets with your public hostname:

| Secret | Keys |
|--------|------|
| `k8s/base/bank-user/secret.yaml` | `KEYCLOAK_SERVER_URL`, `KEYCLOAK_JWKS_URL`, client secrets |
| `k8s/base/core-banking/secret.yaml` | `KEYCLOAK_*` for JWT validation |

Example:

```yaml
KEYCLOAK_SERVER_URL: https://auth.dental-care.me
KEYCLOAK_JWKS_URL: https://auth.dental-care.me/realms/bank/protocol/openid-connect/certs
```

Pods on the same Docker host as Keycloak can use internal URL for Admin API:

```yaml
KEYCLOAK_INTERNAL_URL: http://172.17.0.1:8080
```

## Cloudflare Tunnel

Point `auth.dental-care.me` → `http://localhost:8080` (same as you do today).  
Keep `KC_HOSTNAME=https://auth.dental-care.me` and `KC_PROXY_HEADERS=xforwarded`.

## `start-dev` vs production

This compose uses `start-dev` (embedded dev database, easy setup).

For **production persistence**, use a dedicated Postgres for Keycloak and `command: start` with `KC_DB=postgres`.  
Data in `start-dev` is lost if you remove the container without a volume — fine for learning, not for prod.

## Platform layout (all repos)

```
MY-Bank/
├── keycloak/          ← this folder (IdP)
├── apim/wso2/         ← API gateway
├── k8s/               ← core-banking, bank-user, postgres
├── bank simulator/    ← core banking source
└── b-user/            ← bank user source
```
