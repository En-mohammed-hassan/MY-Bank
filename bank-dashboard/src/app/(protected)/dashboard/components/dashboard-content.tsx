"use client";

import Link from "next/link";
import { Users, UserCircle, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { useSession } from "@/hooks/use-session";
import { hasRole } from "@/lib/auth";
import { useSeedDemo } from "@/hooks/mutations/use-seed-demo";

const quickLinks = [
  { title: "Staff", href: "/staff", icon: Users, text: "View and manage bank staff users." },
  { title: "Customers", href: "/customers", icon: UserCircle, text: "Create retail portal logins." },
  { title: "Accounts", href: "/accounts", icon: Wallet, text: "Look up CIF, accounts, and transfers." },
];

export function OverviewCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {quickLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{link.title}</CardTitle>
                </div>
                <CardDescription>{link.text}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export function SeedDemoCard() {
  const seed = useSeedDemo();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin tools</CardTitle>
        <CardDescription>Load demo CIFs and accounts into core banking (admin only).</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={() => seed.mutate()} disabled={seed.isPending}>
          {seed.isPending ? "Seeding…" : "Seed demo data"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardContent() {
  const { user } = useSession();

  if (!user) return null;

  return (
    <>
      <p className="mb-8 text-muted-foreground">
        Signed in as <strong className="text-foreground">{user.username}</strong> with role{" "}
        <strong className="text-foreground">{user.roles.join(", ") || "none"}</strong>.
      </p>
      <OverviewCards />
      {hasRole(user, "admin") && (
        <div className="mt-8">
          <SeedDemoCard />
        </div>
      )}
    </>
  );
}

export function DashboardPageView() {
  return (
    <PageContainer>
      <PageHeader title="Overview" description="MY-Bank staff operations hub." />
      <DashboardContent />
    </PageContainer>
  );
}
