# user-dashboard — Customer portal UI

Next.js 14 customer portal with **shadcn/ui**, **TanStack Query**, and route-scoped components.

Runs on **http://localhost:3001** (bank-dashboard uses 3000).

## Stack

Same as `bank-dashboard`: shadcn/ui, TanStack Query, react-hook-form + zod, sonner.

## Setup

```bash
cd user-dashboard
cp .env.local.example .env.local
npm install
npm run dev
```

```env
NEXT_PUBLIC_CUSTOMER_API_URL=https://customer-api.dental-care.me
NEXT_PUBLIC_CORE_API_URL=https://core-api.dental-care.me
```

## Project structure

Mirrors `bank-dashboard` — see [bank-dashboard/README.md](../bank-dashboard/README.md) for conventions.

## Flow

1. Staff creates customer via **bank-dashboard** → `POST customer-api/customers`
2. Customer logs in here (`customer-app` via **c-user** BFF)
3. **editor** can PATCH profile; **viewer** is read-only
4. If CIF is linked, home loads core banking profile + accounts via dependent queries

## Docker

```bash
docker build -t user-dashboard .
docker run -p 3001:3001 user-dashboard
```
