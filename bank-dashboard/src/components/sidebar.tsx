"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasRole, type SessionUser } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Overview", roles: ["admin", "supervisor", "retail"] as const },
  { href: "/staff", label: "Staff", roles: ["admin", "supervisor", "retail"] as const },
  { href: "/accounts", label: "Accounts", roles: ["admin", "supervisor", "retail"] as const },
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
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-bank-teal text-white" : "text-white/80 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-sm font-medium">{user.username}</p>
        <p className="text-xs text-white/60">{user.roles.join(", ") || "no staff role"}</p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 text-sm text-teal-300 hover:text-teal-200"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
