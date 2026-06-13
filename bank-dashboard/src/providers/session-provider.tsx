"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser, logout, type SessionUser } from "@/lib/auth";
import { usersApiBase } from "@/lib/api";

type SessionContextValue = {
  user: SessionUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refresh: () => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setUser(getSessionUser());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    if (usersApiBase) await logout(usersApiBase);
    else {
      const { clearSession } = await import("@/lib/auth");
      clearSession();
    }
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, isLoading, logout: handleLogout, refresh }),
    [user, isLoading, handleLogout, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
