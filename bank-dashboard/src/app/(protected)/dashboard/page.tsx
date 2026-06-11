"use client";

import { useEffect, useState } from "react";
import { getSessionUser, hasRole } from "@/lib/auth";
import { apiFetch, coreApi } from "@/lib/api";

export default function DashboardPage() {
  const user = getSessionUser();
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [seedErr, setSeedErr] = useState<string | null>(null);

  async function runSeed() {
    setSeedMsg(null);
    setSeedErr(null);
    try {
      await apiFetch(coreApi, "/core/seed", { method: "POST" });
      setSeedMsg("Demo data loaded (CIF10001, CIF10002).");
    } catch (e) {
      setSeedErr(e instanceof Error ? e.message : "Seed failed");
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-bank-navy">Overview</h1>
      <p className="mt-2 text-slate-600">
        Signed in as <strong>{user.username}</strong> with role{" "}
        <strong>{user.roles.join(", ") || "none"}</strong>.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card title="Staff" href="/staff" text="View and manage bank staff users." />
        <Card title="Accounts" href="/accounts" text="Look up customer accounts and transfers." />
      </div>

      {hasRole(user, "admin") && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-bank-navy">Admin tools</h2>
          <p className="mt-1 text-sm text-slate-600">
            Load demo CIFs and accounts into core banking (admin only).
          </p>
          <button
            type="button"
            onClick={runSeed}
            className="mt-4 rounded-lg bg-bank-navy px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            Seed demo data
          </button>
          {seedMsg && <p className="mt-3 text-sm text-green-700">{seedMsg}</p>}
          {seedErr && <p className="mt-3 text-sm text-red-700">{seedErr}</p>}
        </div>
      )}
    </div>
  );
}

function Card({ title, href, text }: { title: string; href: string; text: string }) {
  return (
    <a
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-bank-teal"
    >
      <h2 className="font-semibold text-bank-navy">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
    </a>
  );
}
