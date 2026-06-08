# Bank User Service

Internal bank staff user management for the **Agentic Banking OS**. Manages platform staff (`platform_admin`, `bank_admin`, `bank_support`, `bank_auditor`, `relationship_manager`) with Keycloak as the identity source of truth.

## Stack

- FastAPI
- PostgreSQL 16 + SQLAlchemy 2.0
- Keycloak Admin REST API (user CRUD, roles)
- JWT validation via Keycloak JWKS

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

Health check:

```bash
curl http://localhost:8002/health
```

Expected:

```json
{"status":"ok","service":"bank-user-service"}
```

API docs: http://localhost:8002/docs

## Architecture

```
Admin UI / API Manager
        |
        | Bearer JWT
        v
  bank-user-service  ----->  PostgreSQL (bank_staff_users)
        |
        | Admin REST API (service account)
        v
      Keycloak (identity + realm roles)
```

### Data ownership

| System | Stores |
|--------|--------|
| **Keycloak** | username, email, password hash, enabled flag, realm roles |
| **App DB** | staff profile extension linked by `keycloak_user_id` |
| **Not in app DB** | passwords, balances, CIF, transactions |

### Keycloak linking

Every staff record has a `keycloak_user_id` that matches the Keycloak user UUID.

```
POST /bank-users
  → Keycloak creates user, returns id: "a1b2c3d4-..."
  → App DB: bank_staff_users.keycloak_user_id = "a1b2c3d4-..."

User logs in via Keycloak
  → JWT sub = "a1b2c3d4-..."
  → JWT realm_access.roles = ["bank_admin"]

GET /bank-users (with Bearer token)
  → Service validates JWT signature via JWKS
  → Role guard checks caller permissions
```

The JWT `sub` claim is the canonical link between login identity and the app staff profile.

## Keycloak setup (Infra tab)

Configure Keycloak **before** using staff management endpoints.

### 1. Realm

Create realm: `bank`

### 2. Realm roles

Create these realm roles:

- `platform_admin`
- `bank_admin`
- `bank_support`
- `bank_auditor`
- `relationship_manager`

### 3. Service account client (Admin API)

Create client `bank-user-service`:

1. Client type: **OpenID Connect**
2. Client authentication: **ON** (confidential)
3. Service accounts roles: **ON**
4. Save and copy the **Client secret**

Assign service account roles:

1. Open client → **Service account roles**
2. Client roles → filter `realm-management`
3. Assign: `manage-users`, `view-users`, `query-users`

### 4. API / frontend clients (later)

- `bank-web` — public client for Next.js (PKCE)
- `bank-api` — optional audience for JWT validation

### 5. Bootstrap admin user

Create a user in Keycloak manually (or via Admin Console) with role `platform_admin`. Use that account to obtain tokens for calling this service.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `APP_PORT` | Host port (8002 in compose) |
| `KEYCLOAK_SERVER_URL` | Keycloak base URL (e.g. `http://localhost:8080`) |
| `KEYCLOAK_REALM` | Realm name (`bank`) |
| `KEYCLOAK_ADMIN_CLIENT_ID` | Service account client id |
| `KEYCLOAK_ADMIN_CLIENT_SECRET` | Service account client secret |
| `KEYCLOAK_JWKS_URL` | JWKS endpoint for JWT validation |
| `KEYCLOAK_AUDIENCE` | Optional JWT audience; leave empty to skip audience check |

When running in Docker against Keycloak on the host machine, `docker-compose.yml` defaults to `host.docker.internal:8080`.

## API endpoints

### Auth (proxied to Keycloak)

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/login` | none — returns Keycloak tokens |
| POST | `/auth/refresh` | none — body: `refresh_token` |
| POST | `/auth/logout` | none — body: `refresh_token` |

Frontend and Postman can call these on bank-user instead of Keycloak directly.
Requires public client `bank-web` with **Direct access grants** enabled.

### Staff management

| Method | Path | Required roles |
|--------|------|----------------|
| GET | `/health` | none |
| POST | `/bank-users` | `platform_admin`, `bank_admin` |
| GET | `/bank-users` | `platform_admin`, `bank_admin`, `bank_support` |
| GET | `/bank-users/{user_id}` | same as list |
| PATCH | `/bank-users/{user_id}/role` | `platform_admin`, `bank_admin` |
| PATCH | `/bank-users/{user_id}/status` | `platform_admin`, `bank_admin` |
| DELETE | `/bank-users/{user_id}` | `platform_admin` |

Query params for list: `?role=bank_support&status=active`

## Example flows

### 1. Get admin access token

```bash
curl -s -X POST "http://localhost:8080/realms/bank/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=bank-web" \
  -d "username=admin" \
  -d "password=your-password"
```

Save `access_token` from the response.

### 2. Create bank staff user

```bash
curl -X POST "http://localhost:8002/bank-users" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane.support",
    "email": "jane.support@bank.example",
    "full_name": "Jane Support",
    "role": "bank_support",
    "department": "Operations",
    "temporary_password": "TempPass123!"
  }'
```

This creates the user in Keycloak (with temporary password) and saves the profile in the app DB with the linked `keycloak_user_id`.

### 3. List staff

```bash
curl "http://localhost:8002/bank-users?status=active" \
  -H "Authorization: Bearer <access_token>"
```

### 4. Change role

```bash
curl -X PATCH "http://localhost:8002/bank-users/<user_id>/role" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "bank_auditor"}'
```

### 5. Disable staff

```bash
curl -X PATCH "http://localhost:8002/bank-users/<user_id>/status" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "disabled"}'
```

### 6. Hard delete

```bash
curl -X DELETE "http://localhost:8002/bank-users/<user_id>" \
  -H "Authorization: Bearer <access_token>"
```

Deletes the app DB row first, then removes the Keycloak user. If Keycloak deletion fails, the DB record is restored.

## API Manager routing (later)

When the API gateway is added:

```
/api/bank-users  →  bank-user-service:8000/bank-users
```

The frontend and admin tools call the gateway; the gateway forwards the Bearer token unchanged.

## Project structure

```
app/
├── api/routes/       # HTTP endpoints
├── core/auth.py      # JWT validation + role guards
├── db/               # SQLAlchemy session
├── models/           # bank_staff_users table
├── schemas/          # Pydantic DTOs
└── services/         # Keycloak client + staff orchestration
```

## Local development (without Docker)

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

Requires a running PostgreSQL instance and Keycloak configured as above.
