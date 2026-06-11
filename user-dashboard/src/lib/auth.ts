export type CustomerRole = "editor" | "viewer";

const ACCESS_KEY = "customer_access_token";
const REFRESH_KEY = "customer_refresh_token";
const USERNAME_KEY = "customer_username";

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

export type SessionUser = {
  username: string;
  roles: CustomerRole[];
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
  const customerRoles = allRoles.filter((r): r is CustomerRole =>
    ["editor", "viewer"].includes(r),
  );

  return {
    username:
      (claims.preferred_username as string) ||
      localStorage.getItem(USERNAME_KEY) ||
      "customer",
    roles: customerRoles,
  };
}

export function hasRole(user: SessionUser | null, ...roles: CustomerRole[]): boolean {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}

export function saveSession(tokens: TokenResponse, username: string): void {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  if (tokens.refresh_token) localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export async function login(
  apiUrl: string,
  username: string,
  password: string,
): Promise<SessionUser> {
  const res = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error((await res.text()) || `Login failed (${res.status})`);
  }
  const tokens = (await res.json()) as TokenResponse;
  saveSession(tokens, username);
  const user = getSessionUser();
  if (!user) throw new Error("Login succeeded but session could not be read");
  return user;
}

export async function logout(apiUrl: string): Promise<void> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (refresh) {
    try {
      await fetch(`${apiUrl}/auth/logout`, {
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
