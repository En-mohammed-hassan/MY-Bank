# MY-Bank Staff Dashboard

Next.js staff dashboard for the Agentic Banking OS. Logs in via **users-api** (`/auth/login`), then calls **users-api** and **core-api** with the JWT.

## Pages

| Route | Who | What |
|-------|-----|------|
| `/login` | everyone | Sign in |
| `/dashboard` | all staff | Overview + seed demo (admin) |
| `/staff` | all staff | List staff; create (admin, supervisor) |
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
```

### CORS (required for browser calls)

Both APIs must allow `http://localhost:3000`:

```env
# bank-user + core-banking
CORS_ORIGINS=http://localhost:3000
```

After deploying API images with CORS support, restart pods. For production dashboard host add:

```env
CORS_ORIGINS=http://localhost:3000,https://dashboard.dental-care.me
```

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

## Production deploy (later)

- Build: `npm run build && npm start`
- Or host on Vercel / Cloudflare Pages
- Add Cloudflare tunnel route: `dashboard.dental-care.me` → `:3000`
- Set `CORS_ORIGINS` on APIs to include production dashboard URL
