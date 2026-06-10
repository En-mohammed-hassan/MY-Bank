# Keycloak + WSO2 OAuth2 configuration

Use this when publishing APIs in WSO2 Publisher 4.5.

## Keycloak client

1. Realm: `bank`
2. Create confidential client `bank-api` (or reuse `bank-web`)
3. Valid redirect URIs: `https://api.dental-care.me/*`, `https://localhost:8243/*`
4. Enable **Direct access grants** for Postman password flow

## Token endpoints

| Setting | Value |
|---------|-------|
| Token URL | `https://auth.dental-care.me/realms/bank/protocol/openid-connect/token` |
| JWKS URL | `https://auth.dental-care.me/realms/bank/protocol/openid-connect/certs` |
| Issuer | `https://auth.dental-care.me/realms/bank` |

## WSO2 Publisher steps

1. **API → Develop → API Configurations → Application Level Security** → OAuth2
2. **Dev Portal → Applications** → create app → generate keys → subscribe to APIs
3. For JWT validation policy (optional defense in depth):
   - Add **JWT Validation** mediation policy
   - JWKS URL: Keycloak certs URL above
   - Issuer: Keycloak issuer above

## Audience alignment

`core-banking` and `bank-user` accept tokens with audience `bank-web`, `account`, or `bank-api` (when `KEYCLOAK_AUDIENCE=bank-api` is set in k8s secrets).
