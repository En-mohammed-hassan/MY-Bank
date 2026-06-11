# Platform deploy cheat sheet — Keycloak + WSO2 + Cloudflare Tunnel

Quick reference to redeploy MY-Bank **platform services** (Docker on the host, outside k8s).

Replace `dental-care.me` with your domain when redeploying.

---

## URL map (what each hostname is for)

| Public URL | Local origin | Purpose |
|------------|--------------|---------|
| `https://auth.dental-care.me` | `http://127.0.0.1:8080` | Keycloak (login, JWT) |
| `https://apim.dental-care.me/publisher` | `http://127.0.0.1:8090` → nginx → WSO2 `:9443` | WSO2 Publisher (admin UI) |
| `https://api.dental-care.me` | `http://127.0.0.1:8280` | WSO2 API Gateway (published APIs) |
| `https://core-api.dental-care.me` | `http://127.0.0.1:32665` (or `:80`) | k8s → core-banking |
| `https://users-api.dental-care.me` | `http://127.0.0.1:32665` (or `:80`) | k8s → bank-user |

**Do not mix:** `/publisher` and `/oauth2` live on **`apim.*`**, not `api.*`.

---

## 1. Keycloak

```bash
cd keycloak
cp .env.example .env
```

Edit `.env` for production:

```env
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<strong-password>
KC_HOSTNAME=https://auth.dental-care.me
KC_PROXY_HEADERS=xforwarded
KEYCLOAK_HTTP_PORT=8080
```

Start:

```bash
docker compose up -d
docker compose ps
```

Verify locally:

```bash
curl -sI http://127.0.0.1:8080 | head -1
```

**After first login** (https://auth.dental-care.me):

1. Create realm **`bank`**
2. Clients: `bank-user-service` (confidential), `bank-web` (public), optional `bank-api`
3. Realm roles: `platform_admin`, `bank_admin`, `bank_support`, `bank_auditor`, `relationship_manager`

Details: [`keycloak/README.md`](../keycloak/README.md), [`b-user/README.md`](../b-user/README.md)

**Cloudflare tunnel route:** `auth.dental-care.me` → **HTTP** `127.0.0.1:8080`

---

## 2. WSO2 API Manager

### 2a. Config file (before first start)

Edit [`apim/wso2/conf/deployment.toml`](../apim/wso2/conf/deployment.toml):

```toml
[server]
hostname = "apim.dental-care.me"    # Publisher + OAuth (NOT api.*)

[[apim.gateway.environment]]
https_endpoint = "https://api.dental-care.me"
http_endpoint = "http://api.dental-care.me"
service_url = "https://apim.dental-care.me/services/"

[transport.https.properties]
proxyPort = 443
```

### 2b. Start WSO2

```bash
cd apim/wso2
docker compose up -d
docker compose ps    # wait until healthy (~2–3 min)
```

Verify locally:

```bash
curl -sk -o /dev/null -w "publisher: %{http_code}\n" https://127.0.0.1:9443/publisher
curl -s -o /dev/null -w "gateway:  %{http_code}\n" http://127.0.0.1:8280/
```

Default login: **admin / admin** (change in production).

### 2c. nginx proxy for Publisher (Cloudflare Tunnel)

WSO2 uses a **self-signed** cert on `:9443`. Cloudflared rejects `https://127.0.0.1:9443` unless you use `noTLSVerify`. **nginx on HTTP :8090** avoids that.

```bash
sudo apt-get install -y nginx

sudo tee /etc/nginx/sites-available/apim-proxy > /dev/null << 'EOF'
server {
    listen 8090;
    server_name localhost;
    location / {
        proxy_pass https://127.0.0.1:9443;
        proxy_ssl_verify off;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/apim-proxy /etc/nginx/sites-enabled/apim-proxy
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

curl -sI http://127.0.0.1:8090/publisher | head -1
```

### 2d. Fresh start (avoid Carbon OAuth callback edits)

If hostname was wrong or you logged in via `localhost` first:

```bash
cd apim/wso2
docker compose down
docker rm -f my-bank-wso2am 2>/dev/null
docker compose up -d
```

**First login must be:** `https://apim.dental-care.me/publisher` (incognito).  
Never open `localhost:9443` or `api.dental-care.me/publisher` before that.

### 2e. Import APIs (Publisher UI)

1. https://apim.dental-care.me/publisher → admin / admin
2. **Create API** → **Import OpenAPI**
3. `apim/apis/core-banking.openapi.yaml` → endpoint `https://core-api.dental-care.me`
4. `apim/apis/bank-user.openapi.yaml` → endpoint `https://users-api.dental-care.me`
5. **Publish** both to **Default** gateway

### 2f. Keycloak on APIs (Publisher)

Per API → **Key Managers** → external OAuth:

| Field | Value |
|-------|--------|
| Token URL | `https://auth.dental-care.me/realms/bank/protocol/openid-connect/token` |
| JWKS URL | `https://auth.dental-care.me/realms/bank/protocol/openid-connect/certs` |
| Issuer | `https://auth.dental-care.me/realms/bank` |

Mark `/health` (and bank-user `/auth/*`) as **unsecured**.

Full steps: [`apim/README.md`](../apim/README.md)

---

## 3. Cloudflare Tunnel routes

In **Zero Trust → Networks → Tunnels → your tunnel → Routes** (path field **empty**):

| Hostname | Type | Origin |
|----------|------|--------|
| `auth.dental-care.me` | HTTP | `127.0.0.1:8080` |
| `api.dental-care.me` | HTTP | `127.0.0.1:8280` |
| `apim.dental-care.me` | HTTP | `127.0.0.1:8090` |
| `users-api.dental-care.me` | HTTP | `127.0.0.1:32665` |
| `core-api.dental-care.me` | HTTP | `127.0.0.1:32665` |

Use **HTTP** origins for local services. Cloudflare handles HTTPS to the public.

Restart connector after changes:

```bash
sudo systemctl restart cloudflared
sudo journalctl -u cloudflared -n 30 --no-pager
```

If `apim` still 502 with HTTPS origin, logs show:

`x509: cannot validate certificate for 127.0.0.1` → use nginx `:8090` or HTTP gateway `:8280`.

More detail: [`cloudflare-tunnel.md`](cloudflare-tunnel.md)

---

## 4. Verify end-to-end

```bash
# On server
curl -sI http://127.0.0.1:8080 | head -1
curl -sI http://127.0.0.1:8090/publisher | head -1
curl -sI http://127.0.0.1:8280/ | head -1

# From anywhere
curl -sI https://auth.dental-care.me | head -1
curl -sI https://apim.dental-care.me/publisher | head -1
curl -sI https://api.dental-care.me/ | head -1
```

Token test:

```bash
curl -sk -X POST "https://auth.dental-care.me/realms/bank/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=bank-web&username=admin&password=YOUR_PASSWORD"
```

---

## 5. Common mistakes

| Symptom | Cause | Fix |
|---------|--------|-----|
| `ERR_NAME_NOT_RESOLVED` | DNS / router cache | Add tunnel route; PC DNS `1.1.1.1`; `ipconfig /flushdns` |
| 502 on `apim.*` | TLS verify to `:9443` | nginx on `:8090`, tunnel → HTTP |
| 404 on `api.*/publisher` | Wrong hostname | Use `apim.dental-care.me/publisher` |
| `callback.not.match` | OAuth URLs in old DB | Fresh WSO2 start + login only via `apim.*` |
| Redirect to `api.*/oauth2` | `server.hostname` = `api.*` | Set `hostname = "apim.dental-care.me"` |

---

## 6. New server **with public IP** (no tunnel)

You can skip Cloudflare + nginx workaround:

```
Internet → nginx/Caddy (Let's Encrypt) → Keycloak :8080, WSO2 :8280 / :9443
```

- Point DNS **A records** to the server IP
- One reverse proxy with real TLS certs
- Same `deployment.toml` hostnames (`apim.*` / `api.*`)

Tunnel + nginx is only needed when there is **no public IP** or you want Cloudflare in front.

---

## File locations

```
MY-Bank/
├── keycloak/                 docker compose + .env
├── apim/wso2/                docker compose + conf/deployment.toml
├── apim/apis/                OpenAPI to import
├── platform/
│   ├── docker-platform-deploy.md   ← this file
│   └── cloudflare-tunnel.md
└── k8s/                      microservices (separate deploy)
```
