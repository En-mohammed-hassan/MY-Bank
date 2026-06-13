import type { SessionUser, StaffRole, TokenResponse } from "@/types";
import {
  clearSession,
  decodeJwtPayload,
  extractStaffRoles,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./token";

export type { SessionUser, StaffRole, TokenResponse };

export function getSessionUser(): SessionUser | null {
  const token = getAccessToken();
  if (!token) return null;

  const claims = decodeJwtPayload(token);
  if (!claims) return null;

  return {
    username:
      (claims.preferred_username as string) ||
      (typeof window !== "undefined" ? localStorage.getItem("bank_username") : null) ||
      "user",
    roles: extractStaffRoles(claims),
  };
}

export function hasRole(user: SessionUser | null, ...roles: StaffRole[]): boolean {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}

export function saveSession(tokens: TokenResponse, username: string): void {
  saveTokens(tokens.access_token, tokens.refresh_token, username);
}

export async function login(
  usersApiUrl: string,
  username: string,
  password: string,
): Promise<SessionUser> {
  const res = await fetch(`${usersApiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Login failed (${res.status})`);
  }

  const tokens = (await res.json()) as TokenResponse;
  saveSession(tokens, username);

  const user = getSessionUser();
  if (!user) throw new Error("Login succeeded but session could not be read");
  return user;
}

export async function logout(usersApiUrl: string): Promise<void> {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await fetch(`${usersApiUrl}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
    } catch {
      // still clear local session
    }
  }
  clearSession();
}

export { clearSession } from "./token";
