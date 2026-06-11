"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import {
  clearSession,
  getSessionUser,
  logout,
  type SessionUser,
} from "@/lib/auth";
import { usersApi } from "@/lib/api";

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const session = getSessionUser();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session);
  }, [router]);

  async function handleLogout() {
    if (usersApi) await logout(usersApi);
    else clearSession();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
