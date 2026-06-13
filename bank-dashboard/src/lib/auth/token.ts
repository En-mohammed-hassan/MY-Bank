import type { StaffRole } from "@/types";

const ACCESS_KEY = "bank_access_token";
const REFRESH_KEY = "bank_refresh_token";
const USERNAME_KEY = "bank_username";

const LEGACY_ROLE_MAP: Record<string, StaffRole> = {
  platform_admin: "admin",
  bank_admin: "admin",
  bank_support: "supervisor",
  bank_auditor: "supervisor",
  relationship_manager: "retail",
};

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
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

export function extractStaffRoles(claims: Record<string, unknown>): StaffRole[] {
  const realmAccess = claims.realm_access as { roles?: string[] } | undefined;
  const allRoles = realmAccess?.roles ?? [];
  return allRoles
    .map((r) => (LEGACY_ROLE_MAP[r] ?? r) as string)
    .filter((r): r is StaffRole => ["admin", "supervisor", "retail"].includes(r));
}
