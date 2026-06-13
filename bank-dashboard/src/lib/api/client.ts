import { getAccessToken } from "@/lib/auth/token";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return `Request failed (${res.status})`;
  try {
    const body = JSON.parse(text) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
    return JSON.stringify(body);
  } catch {
    return text;
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
    throw new ApiError(await readErrorMessage(res), res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
