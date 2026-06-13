"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Wallet,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasRole, type SessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["admin", "supervisor", "retail"] as const },
  { href: "/staff", label: "Staff", icon: Users, roles: ["admin", "supervisor", "retail"] as const },
  { href: "/customers", label: "Customers", icon: UserCircle, roles: ["admin", "supervisor"] as const },
  { href: "/accounts", label: "Accounts", icon: Wallet, roles: ["admin", "supervisor", "retail"] as const },
];

type Props = {
  user: SessionUser;
  onLogout: () => void;
};

export function Sidebar({ user, onLogout }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col bg-bank-navy text-white min-h-screen">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-lg font-semibold tracking-tight">MY-Bank</p>
        <p className="text-sm text-white/60">Staff Dashboard</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links
          .filter((l) => hasRole(user, ...l.roles))
          .map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active ? "bg-primary text-white" : "text-white/80 hover:bg-white/10",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-sm font-medium">{user.username}</p>
        <p className="text-xs text-white/60">{user.roles.join(", ") || "no staff role"}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="mt-3 h-auto p-0 text-teal-300 hover:bg-transparent hover:text-teal-200"
        >
          <LogOut className="mr-1 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

export function SidebarSkeleton() {
  return (
    <aside className="flex w-64 flex-col bg-bank-navy min-h-screen p-6 space-y-4">
      <Skeleton className="h-6 w-32 bg-white/20" />
      <Skeleton className="h-4 w-24 bg-white/10" />
      <Separator className="bg-white/10" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full bg-white/10" />
      ))}
    </aside>
  );
}
