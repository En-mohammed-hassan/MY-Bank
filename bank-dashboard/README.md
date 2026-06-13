# bank-dashboard — Staff portal UI

Next.js 14 staff dashboard with **shadcn/ui**, **TanStack Query**, and route-scoped components.

Runs on **http://localhost:3000** (user-dashboard uses 3001).

## Stack

- Next.js App Router
- shadcn/ui + Tailwind
- TanStack Query (server state, loading/error)
- react-hook-form + zod (forms)
- sonner (toasts)

## Setup

```bash
cd bank-dashboard
cp .env.local.example .env.local
npm install
npm run dev
```

```env
NEXT_PUBLIC_USERS_API_URL=https://users-api.dental-care.me
NEXT_PUBLIC_CORE_API_URL=https://core-api.dental-care.me
NEXT_PUBLIC_CUSTOMER_API_URL=https://customer-api.dental-care.me
```

## Project structure

```
src/
  app/                    # Routes (thin page.tsx + components/)
  components/
    ui/                   # shadcn primitives
    layout/               # Shell, sidebar, page header
    feedback/             # Empty/error/loading states
  hooks/
    queries/              # useStaffList, useCustomersList, …
    mutations/            # useCreateStaff, useLogin, …
  types/                  # Domain types
  lib/
    api/                  # API clients per backend
    auth/                 # JWT session helpers
    query/                # Query keys
    schemas/              # Zod form schemas
  providers/              # Query + session + toasts
```

## Pages

| Route | Who | What |
|-------|-----|------|
| `/login` | everyone | Sign in |
| `/dashboard` | all staff | Overview + seed demo (admin) |
| `/staff` | all staff | List staff; create (admin, supervisor) |
| `/customers` | admin, supervisor | Create/list retail customers |
| `/accounts` | all staff | CIF lookup, accounts, transfers |

## Auth

Login via **b-user** BFF (`POST users-api/auth/login`). JWT stored in `localStorage`; React Query handles 401 → redirect to login.

## Docker

```bash
docker build -t bank-dashboard .
docker run -p 3000:3000 bank-dashboard
```
