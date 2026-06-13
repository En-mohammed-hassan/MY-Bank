import type { CustomerRole, SessionUser, TokenResponse } from "@/types";
import {
  clearSession,
  decodeJwtPayload,
  extractCustomerRoles,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./token";

export type { SessionUser, CustomerRole, TokenResponse };

export function getSessionUser(): SessionUser | null {
  const token = getAccessToken();
  if (!token) return null;
  const claims = decodeJwtPayload(token);
  if (!claims) return null;
  return {
    username:
      (claims.preferred_username as string) ||
      (typeof window !== "undefined" ? localStorage.getItem("customer_username") : null) ||
      "user",
    roles: extractCustomerRoles(claims),
  };
}

export function hasRole(user: SessionUser | null, ...roles: CustomerRole[]): boolean {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}

export function saveSession(tokens: TokenResponse, username: string): void {
  saveTokens(tokens.access_token, tokens.refresh_token, username);
}

export async function login(customerApiUrl: string, username: string, password: string): Promise<SessionUser> {
  const res = await fetch(`${customerApiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error((await res.text()) || `Login failed (${res.status})`);
  const tokens = (await res.json()) as TokenResponse;
  saveSession(tokens, username);
  const user = getSessionUser();
  if (!user) throw new Error("Login succeeded but session could not be read");
  return user;
}

export async function logout(customerApiUrl: string): Promise<void> {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await fetch(`${customerApiUrl}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
    } catch {
      /* ignore */
    }
  }
  clearSession();
}

export { clearSession } from "./token";
