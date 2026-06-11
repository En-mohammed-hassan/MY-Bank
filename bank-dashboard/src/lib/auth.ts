export type StaffRole = "admin" | "supervisor" | "retail";

const ACCESS_KEY = "bank_access_token";
const REFRESH_KEY = "bank_refresh_token";
const USERNAME_KEY = "bank_username";

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

export type SessionUser = {
  username: string;
  roles: StaffRole[];
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
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

export function getSessionUser(): SessionUser | null {
  const token = getAccessToken();
  if (!token) return null;

  const claims = decodeJwtPayload(token);
  if (!claims) return null;

  const realmAccess = claims.realm_access as { roles?: string[] } | undefined;
  const allRoles = realmAccess?.roles ?? [];
  const staffRoles = allRoles.filter((r): r is StaffRole =>
    ["admin", "supervisor", "retail"].includes(r),
  );

  return {
    username:
      (claims.preferred_username as string) ||
      localStorage.getItem(USERNAME_KEY) ||
      "user",
    roles: staffRoles,
  };
}

export function hasRole(user: SessionUser | null, ...roles: StaffRole[]): boolean {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}

export function saveSession(
  tokens: TokenResponse,
  username: string,
): void {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  }
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USERNAME_KEY);
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
  const refresh = localStorage.getItem(REFRESH_KEY);
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
