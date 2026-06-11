import { getAccessToken } from "./auth";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });

  if (res.status === 401) {
    throw new ApiError("Session expired — please log in again", 401);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.detail ?? JSON.stringify(body);
    } catch {
      message = (await res.text()) || message;
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const usersApi = process.env.NEXT_PUBLIC_USERS_API_URL ?? "";
export const coreApi = process.env.NEXT_PUBLIC_CORE_API_URL ?? "";
export const customerApi = process.env.NEXT_PUBLIC_CUSTOMER_API_URL ?? "";
