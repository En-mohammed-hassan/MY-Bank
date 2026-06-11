"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getSessionUser, logout, type SessionUser } from "@/lib/auth";

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_CUSTOMER_API_URL ?? "";

  useEffect(() => {
    const session = getSessionUser();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session);
  }, [router]);

  async function handleLogout() {
    if (apiUrl) await logout(apiUrl);
    else clearSession();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex justify-between items-center">
        <div>
          <p className="font-semibold text-bank-navy">MY-Bank Customer</p>
          <p className="text-xs text-slate-500">
            {user.username} · {user.roles.join(", ")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-teal-700 hover:text-teal-900"
        >
          Sign out
        </button>
      </header>
      <main className="mx-auto max-w-2xl p-6">{children}</main>
    </div>
  );
}
