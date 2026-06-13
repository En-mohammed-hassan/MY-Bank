import { apiFetch } from "./client";

export const customerApiBase = process.env.NEXT_PUBLIC_CUSTOMER_API_URL ?? "";

export function customerFetch<T>(path: string, init?: RequestInit) {
  return apiFetch<T>(customerApiBase, path, init);
}
