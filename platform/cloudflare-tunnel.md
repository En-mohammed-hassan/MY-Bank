# Cloudflare Tunnel — MY-Bank URL map

All public hostnames use `*.dental-care.me`. TLS ends at **Cloudflare**; tunnels forward to services on your server (Docker + k3s).

## Architecture

```
Internet (HTTPS)
      │
      ▼
 Cloudflare (DNS + TLS)
      │
      ▼
 cloudflared (on your server)
      │
      ├── auth.*          → Keycloak Docker        :8080
      ├── api.*           → WSO2 Gateway           :8243 (HTTPS)
      ├── apim.*          → WSO2 Publisher (admin) :9443 (HTTPS) + Access
      │
      └── *.dental-care.me (k8s APIs + UIs)
              → nginx Ingress on host              :80 (HTTP)
                    ├── core-api.*
                    ├── users-api.*
                    ├── customer-api.*
                    ├── dashboard.*
                    └── kube.*
```

## Tunnel routes (Cloudflare Zero Trust → Tunnels → your tunnel → Public Hostname)

Create **one published application per row**:

| Public hostname | Service URL (origin) | Notes |
|-----------------|-------------------|--------|
| `auth.dental-care.me` | `http://127.0.0.1:8080` | Keycloak (`keycloak/docker compose`) |
| `api.dental-care.me` | `https://127.0.0.1:8243` | WSO2 **API Gateway** — enable **No TLS Verify** on origin |
| `apim.dental-care.me` | `https://127.0.0.1:9443` | WSO2 Publisher/DevPortal — **protect with Cloudflare Access** |
| `core-api.dental-care.me` | `http://127.0.0.1:80` | k8s Ingress → core-banking |
| `users-api.dental-care.me` | `http://127.0.0.1:80` | k8s Ingress → bank-user |
| `customer-api.dental-care.me` | `http://127.0.0.1:80` | k8s Ingress → customer-service |
| `dashboard.dental-care.me` | `http://127.0.0.1:80` | k8s Ingress → bank-dashboard (staff UI) |
| `kube.dental-care.me` | `http://127.0.0.1:80` | k8s Ingress → Kubernetes Dashboard |

### If ingress is not on port 80

Find the nginx ingress port:

```bash
sudo kubectl get svc -A | grep -i ingress
```

Common k3s values:

| Setup | Use instead of `:80` |
|-------|----------------------|
| ingress-nginx NodePort | `http://127.0.0.1:30080` (check your cluster) |
| Host port 80 | `http://127.0.0.1:80` |

All k8s hostnames can share the **same** origin URL — nginx routes by `Host` header.

---

## Step-by-step in Cloudflare dashboard

### 1. Open tunnel config

**Zero Trust** → **Networks** → **Tunnels** → your tunnel → **Public Hostname** (or **Published applications**)

### 2. Add each hostname

For each row in the table above:

1. **Add a public hostname**
2. **Subdomain** + **Domain** = hostname (e.g. `auth` + `dental-care.me`)
3. **Service type:** HTTP or HTTPS as in the table
4. **URL:** host:port (e.g. `127.0.0.1:8080`)

### 3. WSO2 origins (important)

For `api.dental-care.me` and `apim.dental-care.me`:

- Service URL: **`https://`**127.0.0.1:8243 or :9443 (not `http://`)
- Under **Additional settings** → enable **No TLS Verify** (WSO2 uses self-signed certs)

### 4. Keycloak env (must match tunnel)

In `keycloak/.env`:

```env
KC_HOSTNAME=https://auth.dental-care.me
KC_PROXY_HEADERS=xforwarded
```

Restart: `docker compose restart` in `keycloak/`

### 5. WSO2 hostname (after tunnel works)

Edit `apim/wso2/conf/deployment.toml` — uncomment/set prod hostnames:

```toml
[server]
hostname = "api.dental-care.me"

[[apim.gateway.environment]]
https_endpoint = "https://api.dental-care.me:8243"
http_endpoint = "http://api.dental-care.me:8280"
service_url = "https://apim.dental-care.me:9443/services/"
```

Restart: `docker compose restart` in `apim/wso2/`

Use `apim.dental-care.me` for Publisher so gateway URLs stay on `api.dental-care.me`.

### 6. Remove wrong routes

Delete or disable routes that pointed to wrong services, for example:

| Bad route | Problem |
|-----------|---------|
| `auto.dental-care.me` → k8s API :6443 | Kubernetes API — do not expose via tunnel |
| `api.*` → `http://localhost:6443` | Same — use self-hosted runner for CI instead |

---

## Optional: `config.yml` for cloudflared CLI

See [`cloudflared-config.example.yml`](cloudflared-config.example.yml). Copy to the server and run:

```bash
cloudflared tunnel --config /path/to/config.yml run
```

---

## Security checklist

| Hostname | Recommendation |
|----------|----------------|
| `apim.dental-care.me` | Cloudflare Access (email OTP) — admin UI |
| `kube.dental-care.me` | Cloudflare Access — cluster-admin |
| `api.dental-care.me` | Public + OAuth2 at WSO2 |
| `auth.dental-care.me` | Public login (Keycloak brute-force limits) |
| `core-api.*`, `users-api.*` | Prefer clients use `api.dental-care.me` only; keep direct hosts for debug |

---

## Verify each URL

```bash
curl -sI https://auth.dental-care.me
curl -skI https://api.dental-care.me/core-banking/1.0.0/health
curl -sI https://core-api.dental-care.me/health
curl -sI https://users-api.dental-care.me/health
curl -sI https://dashboard.dental-care.me/login
curl -skI https://kube.dental-care.me
```

---

## Quick reference — who owns what

| Layer | Folder | Deploy |
|-------|--------|--------|
| Tunnel | `platform/` (this doc) | Cloudflare + cloudflared on server |
| Keycloak | `keycloak/` | `docker compose up -d` |
| WSO2 APIM | `apim/wso2/` | `docker compose up -d` |
| APIs + dashboards | `k8s/` | GitHub Actions → kubectl |
