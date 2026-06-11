"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, coreFetch } from "@/lib/api";
import { getSessionUser, hasRole } from "@/lib/auth";
import type { Account, AccountListResponse, CoreCustomer, CustomerProfile } from "@/lib/types";

export default function HomePage() {
  const user = getSessionUser();
  const canEdit = hasRole(user, "editor");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [coreCustomer, setCoreCustomer] = useState<CoreCustomer | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<CustomerProfile>("/customers/me")
      .then(async (p) => {
        setProfile(p);
        setFullName(p.full_name);
        if (p.cif) {
          const [customer, accountList] = await Promise.all([
            coreFetch<CoreCustomer>(`/core/customers/${p.cif}`),
            coreFetch<AccountListResponse>(`/core/customers/${p.cif}/accounts`),
          ]);
          setCoreCustomer(customer);
          setAccounts(accountList.accounts);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"));
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setMsg(null);
    setError(null);
    try {
      const updated = await apiFetch<CustomerProfile>("/customers/me", {
        method: "PATCH",
        body: JSON.stringify({ full_name: fullName }),
      });
      setProfile(updated);
      setMsg("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  if (!profile && !error) {
    return <p className="text-slate-600">Loading profile…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-bank-navy">My profile</h1>
      <p className="mt-1 text-slate-600">
        Role: <strong>{user?.roles.join(", ")}</strong>
        {canEdit ? " — you can edit" : " — read only"}
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {msg && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      {profile && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 space-y-3 text-sm">
          <Row label="Username" value={profile.username} />
          <Row label="Email" value={profile.email} />
          <Row label="CIF" value={profile.cif ?? "—"} />
          <Row label="Status" value={profile.status} />

          {canEdit ? (
            <form onSubmit={onSave} className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700">Full name</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <button
                type="submit"
                className="mt-3 rounded-lg bg-bank-teal px-4 py-2 text-sm text-white"
              >
                Save
              </button>
            </form>
          ) : (
            <Row label="Full name" value={profile.full_name} />
          )}
        </div>
      )}

      {profile?.cif && coreCustomer && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-bank-navy">Banking profile</h2>
          <p className="mt-1 text-sm text-slate-600">
            {coreCustomer.full_name} · {coreCustomer.customer_type} · {coreCustomer.status}
          </p>
        </div>
      )}

      {profile?.cif && accounts.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-bank-navy">My accounts</h2>
          <ul className="mt-4 space-y-3">
            {accounts.map((a) => (
              <li
                key={a.account_number}
                className="rounded-lg border border-slate-100 px-4 py-3"
              >
                <p className="font-mono text-sm">{a.account_number}</p>
                <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <Mini label="Product" value={a.product_category} />
                  <Mini label="Status" value={a.status} />
                  <Mini label="Ledger balance" value={a.ledger_balance} />
                  <Mini label="Available" value={a.available_balance} />
                </dl>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile?.cif && accounts.length === 0 && coreCustomer && (
        <p className="mt-4 text-sm text-slate-500">No accounts linked to your CIF yet.</p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
