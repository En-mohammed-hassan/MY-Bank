# MY-Bank Staff Dashboard

Next.js staff dashboard for the Agentic Banking OS. Logs in via **users-api** (`/auth/login`), then calls **users-api** and **core-api** with the JWT.

## Pages

| Route | Who | What |
|-------|-----|------|
| `/login` | everyone | Sign in |
| `/dashboard` | all staff | Overview + seed demo (admin) |
| `/staff` | all staff | List staff; create (admin, supervisor) |
| `/customers` | admin, supervisor | Create/list retail customers (c-user API) |
| `/accounts` | all staff | View CIF/accounts; transfer (admin, supervisor) |

## Local setup

```bash
cd bank-dashboard
cp .env.local.example .env.local
npm install
npm run dev
```

Open **http://localhost:3000**

### Environment

```env
NEXT_PUBLIC_USERS_API_URL=https://users-api.dental-care.me
NEXT_PUBLIC_CORE_API_URL=https://core-api.dental-care.me
NEXT_PUBLIC_CUSTOMER_API_URL=https://customer-api.dental-care.me
```

### CORS

Both APIs allow all origins (`*`) via FastAPI `CORSMiddleware` — no extra env vars needed.

## Auth flow

```
Browser → POST users-api/auth/login { username, password }
       → JWT stored in localStorage
       → All API calls: Authorization: Bearer <token>
       → APIs validate JWT + roles (403 if not allowed)
```

## Keycloak

- Staff log in with **bank-web** client (via users-api proxy).
- User must have realm role: `admin`, `supervisor`, or `retail`.

## Production deploy (Kubernetes)

Same flow as `b-user` and `core-banking`:

1. **Dockerfile** in this folder — Next.js **standalone** image (~150MB runtime, Alpine)
2. **GitHub Actions** builds → `ghcr.io/.../bank-dashboard:latest`
3. **k8s** deploys `bank-dashboard` in `my-bank` namespace
4. **Ingress:** `https://dashboard.dental-care.me`

Local image build:

```bash
docker build -t bank-dashboard \
  --build-arg NEXT_PUBLIC_USERS_API_URL=https://users-api.dental-care.me \
  --build-arg NEXT_PUBLIC_CORE_API_URL=https://core-api.dental-care.me \
  .
```

API URLs are **baked in at build time** (`NEXT_PUBLIC_*`). Change them in the workflow build-args or Dockerfile `ARG` defaults, then rebuild.

## Not the same as Kubernetes Dashboard

| Name | What | Dockerfile in repo? |
|------|------|---------------------|
| **bank-dashboard/** | Staff web UI (this app) | **Yes** — built in CI |
| **k8s/addons/dashboard/** | k8s cluster admin UI | **No** — official upstream image |