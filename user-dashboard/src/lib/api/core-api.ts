import { apiFetch } from "./client";

export const coreApiBase = process.env.NEXT_PUBLIC_CORE_API_URL ?? "";

export function coreFetch<T>(path: string, init?: RequestInit) {
  return apiFetch<T>(coreApiBase, path, init);
}
