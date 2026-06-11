# c-user — Customer portal

Next.js app for **retail customers** (`editor` / `viewer` roles).

Runs on **http://localhost:3001** (staff dashboard uses 3000).

## Setup

```bash
cd c-user
cp .env.local.example .env.local
npm install
npm run dev
```

```env
NEXT_PUBLIC_CUSTOMER_API_URL=https://customer-api.dental-care.me
```

## Flow

1. Staff (admin) creates customer via `POST customer-api/customers`
2. Customer logs in here with temporary password
3. **editor** can PATCH `/customers/me` (update full name)
4. **viewer** sees profile read-only

## Keycloak

Login uses client **`customer-app`** via `customer-service/auth/login`.
