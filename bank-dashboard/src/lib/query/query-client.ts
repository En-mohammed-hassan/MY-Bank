import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";

export function createQueryClient(onUnauthorized?: () => void) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}

export function handleQueryUnauthorized(error: unknown, onUnauthorized: () => void) {
  if (error instanceof ApiError && error.status === 401) {
    clearSession();
    onUnauthorized();
  }
}
