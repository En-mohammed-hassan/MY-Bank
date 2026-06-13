"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Sidebar, SidebarSkeleton } from "@/components/layout/sidebar";
import { PageSkeleton } from "@/components/feedback/states";

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, logout } = useSession();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <SidebarSkeleton />
        <main className="flex-1 p-8">
          <PageSkeleton />
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
