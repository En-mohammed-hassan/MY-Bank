import { apiFetch } from "./client";

export const usersApiBase = process.env.NEXT_PUBLIC_USERS_API_URL ?? "";

export function usersFetch<T>(path: string, init?: RequestInit) {
  return apiFetch<T>(usersApiBase, path, init);
}
