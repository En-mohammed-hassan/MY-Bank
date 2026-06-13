"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/feedback/states";
import { useSession } from "@/hooks/use-session";

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, logout } = useSession();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card px-6 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <main className="mx-auto max-w-2xl p-6"><PageSkeleton /></main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4 flex justify-between items-center">
        <div>
          <p className="font-semibold text-foreground">MY-Bank Customer</p>
          <p className="text-xs text-muted-foreground">
            {user.username} · {user.roles.join(", ")}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={logout}>
          <LogOut className="mr-1 h-4 w-4" />
          Sign out
        </Button>
      </header>
      <main className="mx-auto max-w-2xl p-6">{children}</main>
    </div>
  );
}
