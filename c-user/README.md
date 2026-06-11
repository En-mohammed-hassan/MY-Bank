# c-user — Customer user service

Retail **customer** user management for the Agentic Banking OS — parallel to **`b-user`** (staff).

| | Staff | Customers |
|--|-------|-----------|
| **Service** | `b-user/` → k8s `bank-user` | `c-user/` → k8s `c-user` |
| **Dashboard** | `bank-dashboard/` | `user-dashboard/` |
| **Public API URL** | `users-api.dental-care.me` | `customer-api.dental-care.me` |
| Keycloak login client | `bank-web` | `customer-app` |
| Keycloak service account | `bank-user-service` | `customer-service` |
| Realm roles | `admin`, `supervisor`, `retail` | `editor`, `viewer` |
| Database | `bank_users` | `bank_customers` |

## Keycloak setup (realm `bank`)

### 1. Realm roles

- `editor`
- `viewer`

### 2. Client `customer-app` (public, for user-dashboard)

- Client authentication: **OFF**
- Standard flow: **ON**
- Direct access grants: **ON**

### 3. Client `customer-service` (confidential, backend)

- Client authentication: **ON**
- Service accounts: **ON**
- Copy client secret → `KEYCLOAK_ADMIN_CLIENT_SECRET`

Service account roles (`realm-management`):

- `manage-users`, `view-users`, `query-users`, `view-realm`

## API

| Method | Path | Who |
|--------|------|-----|
| POST | `/auth/login` | public |
| POST | `/customers` | staff `admin`, `supervisor` |
| GET | `/customers` | staff `admin`, `supervisor` |
| GET | `/customers/me` | customer `editor`, `viewer` |
| PATCH | `/customers/me` | customer `editor` only |
| GET | `/customers/{id}` | staff or own profile |

Staff calls use a **bank-web** token (from bank-dashboard). Customers use **customer-app** token (from user-dashboard).

## Local run

```bash
cd c-user
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8003
```

## Kubernetes

Deployed as **`c-user`** in namespace `my-bank`. Uses the `bank_customers` PostgreSQL database (created by init container on first deploy).

For existing clusters missing `bank_customers`:

```bash
kubectl exec -n my-bank postgres-0 -- sh -c 'export PGPASSWORD="$POSTGRES_PASSWORD"; psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '\''bank_customers'\''" | grep -q 1 || psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE bank_customers"'
```

After rename from `customer-service`, delete the old deployment once:

```bash
kubectl delete deployment customer-service -n my-bank --ignore-not-found
```

## Create customer (staff token)

```bash
curl -X POST https://customer-api.dental-care.me/customers \
  -H "Authorization: Bearer <staff-admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "mohammad.c",
    "email": "mohammad@example.com",
    "full_name": "Mohammad Customer",
    "role": "editor",
    "cif": "CIF10001",
    "temporary_password": "TempPass123!"
  }'
```
