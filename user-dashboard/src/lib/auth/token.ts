import type { CustomerRole } from "@/types";

const ACCESS_KEY = "customer_access_token";
const REFRESH_KEY = "customer_refresh_token";
const USERNAME_KEY = "customer_username";

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function saveTokens(accessToken: string, refreshToken?: string, username?: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (username) localStorage.setItem(USERNAME_KEY, username);
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function extractCustomerRoles(claims: Record<string, unknown>): CustomerRole[] {
  const realmAccess = claims.realm_access as { roles?: string[] } | undefined;
  return (realmAccess?.roles ?? []).filter((r): r is CustomerRole => r === "editor" || r === "viewer");
}
