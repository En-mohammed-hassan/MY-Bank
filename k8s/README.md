# Kubernetes deployment (MY-Bank)

Deploy the banking microservices to Kubernetes with **Kustomize** and **GitHub Actions**.

## Architecture

```
                         Clients / Postman / Web app
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  WSO2 APIM (Docker)  │  api.dental-care.me
                         │  wso2/wso2am:4.5.0   │  (external — apim/wso2/)
                         └──────────┬───────────┘
                                    │ OAuth2 JWT validated at gateway
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
         ┌─────────────────────┐         ┌─────────────────────┐
         │  Ingress (nginx)    │         │      Keycloak       │
         │ core-api.* users-*  │         │  auth.* (external)  │
         └──────────┬──────────┘         └─────────────────────┘
                    │                              ▲
         ┌──────────▼──┐              ┌───────────┴───────────┐
         │ core-banking │              │      bank-user         │
         │  Deployment  │              │     Deployment         │
         │  (2 pods)    │              │     (2 pods)           │
         └──────┬───────┘              └───────────┬────────────┘
                │                                │
                └────────────┬───────────────────┘
                             ▼
                    ┌─────────────────┐
                    │    postgres     │
                    │  StatefulSet    │
                    │ core_banking +  │
                    │   bank_users    │
                    └─────────────────┘
```

Each service keeps its **own database** on a shared Postgres instance. **Keycloak** (`keycloak/`) and **WSO2 APIM** (`apim/wso2/`) run outside the cluster on Docker.

### Traffic routing

| Public entry | Routes to |
|--------------|-----------|
| `https://api.dental-care.me` | WSO2 gateway → microservices via Ingress hostnames |
| `https://core-api.dental-care.me` | Direct to core-banking (debug / WSO2 backend) |
| `https://users-api.dental-care.me` | Direct to bank-user (debug / WSO2 backend) |
| `https://auth.dental-care.me` | Keycloak (IdP) |

Point DNS `api.dental-care.me` to the host running `docker compose` in `apim/wso2/`.

## Prerequisites

- Kubernetes cluster (k3s, EKS, GKE, AKS, or kubeadm on your VPS)
- `kubectl` and `kustomize` locally
- Ingress controller (e.g. [ingress-nginx](https://kubernetes.github.io/ingress-nginx/deploy/))
- Storage class for Postgres PVC (default works on most clusters)
- Keycloak already configured (`b-user/README.md`)

## One-time cluster setup

### 1. Edit secrets

Update passwords and Keycloak URLs **before** first deploy:

| File | What to change |
|------|----------------|
| `base/postgres/secret.yaml` | `POSTGRES_PASSWORD` |
| `base/core-banking/secret.yaml` | `DATABASE_URL` + `KEYCLOAK_*` (JWT auth on `/core/*`) |
| `base/bank-user/secret.yaml` | DB password + all `KEYCLOAK_*` values |
| `base/ingress.yaml` | Hostnames (`core.example.com`, etc.) |

Use the same Postgres password in all three DB secrets.

For production, prefer:

```bash
kubectl create secret generic postgres-credentials -n my-bank \
  --from-literal=POSTGRES_USER=bank \
  --from-literal=POSTGRES_PASSWORD='...' \
  --from-literal=POSTGRES_DB=postgres
```

Then remove plaintext secrets from git and use [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) or External Secrets Operator.

### 2. Edit image registry

In `overlays/prod/kustomization.yaml`, replace `YOUR_GITHUB_USER` with your GitHub username/org.

### 3. First manual deploy

```bash
kubectl apply -k k8s/overlays/prod
kubectl get pods -n my-bank -w
```

### 4. Verify

```bash
# Port-forward if Ingress is not ready yet
kubectl port-forward -n my-bank svc/core-banking 8001:80
kubectl port-forward -n my-bank svc/bank-user 8002:80

curl http://localhost:8001/health
curl http://localhost:8002/health
```

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/k8s-deploy.yaml`

On every push to `main`:

1. **build-and-push** (GitHub-hosted): build images and push to **GHCR**
2. **deploy** (self-hosted runner on your k3s server): `kubectl apply`, restart pods, wait for rollouts

You can also trigger the pipeline manually via **Actions → Run workflow**.

### One-time: install self-hosted runner on your server

The deploy job must run **on the same Linux machine as k3s** (no public IP or Cloudflare tunnel needed).

1. GitHub repo → **Settings** → **Actions** → **Runners** → **New self-hosted runner**
2. Choose **Linux** and **x64**
3. SSH into your server and run the commands GitHub shows, for example:

```bash
# Create a folder for the runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download (use the exact URL from GitHub — version may differ)
curl -o actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz
tar xzf actions-runner-linux-x64.tar.gz

# Configure (paste the token from GitHub)
./config.sh --url https://github.com/YOUR_USER/MY-Bank --token YOUR_TOKEN

# Install and start as a service (survives reboot)
sudo ./svc.sh install
sudo ./svc.sh start
```

4. Back in GitHub → **Runners**, confirm the runner shows **Idle** (green).

**One-time: give the runner user a kubeconfig** (the workflow cannot use `sudo` — no password in CI).

Find which user runs the runner (the user you passed to `./svc.sh install`, often your SSH user):

```bash
# Replace mhd with your runner user
sudo mkdir -p /home/mhd/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /home/mhd/.kube/config
sudo chown mhd:mhd /home/mhd/.kube/config
sudo chmod 600 /home/mhd/.kube/config
```

Verify as that user:

```bash
kubectl get nodes
```

Re-run the GitHub Actions workflow after this.

### Secrets

| Secret | Required? | Description |
|--------|-----------|-------------|
| `KUBE_CONFIG` | **No** | Not used — deploy uses local k3s kubeconfig |
| `GITHUB_TOKEN` | Auto | Used by build job to push to GHCR |

Optional: create a dedicated deploy service account with limited RBAC instead of the default k3s admin kubeconfig.

### Make GHCR images pullable (private repos)

If images are private, create an image pull secret:

```bash
kubectl create secret docker-registry ghcr-pull \
  -n my-bank \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USER \
  --docker-password=YOUR_GITHUB_PAT
```

Add `imagePullSecrets` to deployments in a prod patch.

## Adding new microservices later

For each new service:

1. Add `Dockerfile` in the service folder
2. Add `k8s/base/<service-name>/` (Deployment, Service, Secret/ConfigMap)
3. Register in `k8s/base/kustomization.yaml`
4. Add build step in `.github/workflows/k8s-deploy.yaml`
5. Create a new database in `postgres/configmap-init.yaml`
6. Add Ingress path or hostname

This keeps the **database-per-service** pattern as the platform grows.

## Production upgrades

| Topic | Recommendation |
|-------|------------------|
| Postgres | Move to managed DB (RDS, Cloud SQL); remove in-cluster StatefulSet |
| GitOps | Replace raw `kubectl apply` with **Argo CD** or **Flux** |
| Secrets | Sealed Secrets, Vault, or cloud secret manager |
| TLS | cert-manager + Let's Encrypt on Ingress |
| Observability | Prometheus + Grafana, or Datadog |

## Useful commands

```bash
# Preview manifests
kubectl kustomize k8s/overlays/prod

# Redeploy after secret change
kubectl rollout restart deployment/core-banking -n my-bank
kubectl rollout restart deployment/bank-user -n my-bank

# Logs
kubectl logs -n my-bank -l app.kubernetes.io/name=core-banking -f
kubectl logs -n my-bank -l app.kubernetes.io/name=bank-user -f

# Scale
kubectl scale deployment/core-banking -n my-bank --replicas=3
```
