# Customer Service

Retail **customer** accounts for the Agentic Banking OS — parallel to `b-user` (staff).

| | Staff (`b-user`) | Customers (`customer-service`) |
|--|------------------|--------------------------------|
| Keycloak client (login) | `bank-web` | `customer-app` |
| Service account | `bank-user-service` | `customer-service` |
| Realm roles | `admin`, `supervisor`, `retail` | `editor`, `viewer` |
| Database | `bank_users` | `bank_customers` |

## Keycloak setup (realm `bank`)

### 1. Realm roles

- `editor`
- `viewer`

### 2. Client `customer-app` (public, for c-user UI)

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

Staff calls use a **bank-web** token (from staff dashboard). Customers use **customer-app** token.

## Local run

```bash
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8003
```

## Create customer (staff token)

```bash
curl -X POST http://localhost:8003/customers \
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
