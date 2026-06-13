"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import { SessionProvider } from "@/providers/session-provider";

function makeQueryClient(onUnauthorized: () => void) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status === 401) return false;
          return failureCount < 1;
        },
      },
      mutations: {
        onError: (error) => {
          if (error instanceof ApiError && error.status === 401) {
            clearSession();
            onUnauthorized();
          }
        },
      },
    },
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(() => makeQueryClient(() => router.replace("/login")));

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
        <Toaster richColors position="top-right" />
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
