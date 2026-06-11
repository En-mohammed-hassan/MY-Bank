# user-dashboard — Customer portal UI

Next.js app for **retail customers** (`editor` / `viewer` roles). Mirrors **`bank-dashboard`** for staff.

| | Staff | Customers |
|--|-------|-----------|
| **Dashboard** | `bank-dashboard/` (port 3000) | `user-dashboard/` (port 3001) |
| **Backend service** | `b-user` | `c-user` |
| **API URL** | `users-api.dental-care.me` | `customer-api.dental-care.me` |
| Keycloak client | `bank-web` | `customer-app` |

## Setup

```bash
cd user-dashboard
cp .env.local.example .env.local
npm install
npm run dev
```

Open **http://localhost:3001**

```env
NEXT_PUBLIC_CUSTOMER_API_URL=https://customer-api.dental-care.me
NEXT_PUBLIC_CORE_API_URL=https://core-api.dental-care.me
```

## Flow

1. Staff creates customer via **bank-dashboard** → `POST customer-api/customers`
2. Customer logs in here with temporary password
3. **editor** can PATCH `/customers/me` (update full name)
4. **viewer** sees profile read-only
5. If CIF is linked, home shows core banking profile + accounts

## Auth

Login uses client **`customer-app`** via `c-user` auth BFF (`POST /auth/login` on customer-api).
