# Kubernetes deployment (MY-Bank)

Deploy the banking microservices to Kubernetes with **Kustomize** and **GitHub Actions**.

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │           Ingress (nginx)            │
                    │  core.example.com  users.example.com │
                    └──────────┬──────────────┬───────────┘
                               │              │
                    ┌──────────▼──┐    ┌──────▼────────┐
                    │ core-banking │    │  bank-user    │
                    │  Deployment  │    │  Deployment   │
                    │  (2 pods)    │    │  (2 pods)     │
                    └──────┬───────┘    └───────┬───────┘
                           │                    │
                           │    ┌───────────────┘
                           │    │              HTTPS (Admin API + JWKS)
                           ▼    ▼                    ▼
                    ┌─────────────────┐      ┌──────────────┐
                    │    postgres     │      │   Keycloak   │
                    │  StatefulSet    │      │  (external)  │
                    │ core_banking +  │      └──────────────┘
                    │   bank_users    │
                    └─────────────────┘
```

Each service keeps its **own database** on a shared Postgres instance. Keycloak stays external (your existing server install).

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
| `base/core-banking/secret.yaml` | `DATABASE_URL` password |
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

1. Build Docker images for both services
2. Push to **GitHub Container Registry** (`ghcr.io`)
3. `kubectl apply -k k8s/overlays/prod` on your cluster

### Required GitHub secrets

| Secret | Description |
|--------|-------------|
| `KUBE_CONFIG` | Full kubeconfig file content (base64 or raw YAML) |

Create a deploy service account on the cluster:

```bash
kubectl create serviceaccount github-deploy -n my-bank
kubectl create clusterrolebinding github-deploy-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=my-bank:github-deploy
```

Generate a long-lived token (or use projected token + RBAC with limited permissions in production), then embed in kubeconfig for the Actions secret.

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
