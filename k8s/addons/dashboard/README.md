# Kubernetes Dashboard

Web UI for your k3s cluster (pods, logs, deployments). Deployed **inside the cluster**, unlike Keycloak/APIM which run in Docker on the host.

## Deploy

Included in CI/CD (`kubectl apply -k k8s/addons/dashboard`) or manually:

```bash
kubectl apply -k k8s/addons/dashboard
kubectl get pods -n kubernetes-dashboard
```

## Access

1. DNS / Cloudflare Tunnel: `kube.dental-care.me` → nginx ingress (port 80/443)
2. Open `https://kube.dental-care.me` (or HTTP if TLS not enabled yet)

Staff UI is **bank-dashboard** at `https://dashboard.dental-care.me` (see `bank-dashboard/README.md`).
3. Choose **Token** login
4. Create a token:

```bash
kubectl -n kubernetes-dashboard create token admin-user
```

Paste the token into the dashboard login screen.

## Local access (no ingress)

```bash
kubectl port-forward -n kubernetes-dashboard svc/kubernetes-dashboard 8443:443
```

Open `https://localhost:8443` and use a token as above.

## Security

- `admin-user` has **cluster-admin** — full cluster control
- Protect `kube.dental-care.me` with **Cloudflare Access** or VPN
- For production, create a read-only ServiceAccount instead of `admin-user`

## What this is not

| Component | Where it runs |
|-----------|----------------|
| Kubernetes Dashboard | **In k3s** (`kubernetes-dashboard` namespace) |
| Keycloak | Docker host (`keycloak/`) |
| WSO2 APIM | Docker host (`apim/wso2/`) |
| MY-Bank APIs | k3s (`my-bank` namespace) |
