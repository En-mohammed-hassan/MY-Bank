"use client";

import Link from "next/link";
import { Fragment, FormEvent, useEffect, useState } from "react";
import { apiFetch, coreApi, customerApi } from "@/lib/api";
import type { Account, AccountListResponse, CustomerListResponse, CustomerProfile } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [expandedCif, setExpandedCif] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  async function loadCustomers() {
    setError(null);
    try {
      const data = await apiFetch<CustomerListResponse>(customerApi, "/customers");
      setCustomers(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customers");
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const form = new FormData(e.currentTarget);
    const cifValue = String(form.get("cif") || "").trim();
    try {
      await apiFetch(customerApi, "/customers", {
        method: "POST",
        body: JSON.stringify({
          username: form.get("username"),
          email: form.get("email"),
          full_name: form.get("full_name"),
          role: form.get("role"),
          cif: cifValue || null,
          temporary_password: form.get("temporary_password"),
        }),
      });
      setMsg("Customer created in Keycloak + customer-service.");
      e.currentTarget.reset();
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function loadAccountsForCif(cif: string) {
    if (expandedCif === cif) {
      setExpandedCif(null);
      setAccounts([]);
      return;
    }
    setExpandedCif(cif);
    setAccountsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AccountListResponse>(
        coreApi,
        `/core/customers/${cif}/accounts`,
      );
      setAccounts(data.accounts);
    } catch (err) {
      setAccounts([]);
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setAccountsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-bank-navy">Retail customers</h1>
      <p className="mt-1 text-slate-600">
        Portal users (editor / viewer). Link a CIF to view core banking accounts.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {msg && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 font-semibold">Create customer login</h2>
        <Field name="username" label="Username" placeholder="mohammad.c" required />
        <Field name="email" label="Email" type="email" placeholder="m@example.com" required />
        <Field name="full_name" label="Full name" placeholder="Mohammad Customer" required />
        <Field name="cif" label="CIF (core banking link)" placeholder="CIF10001" />
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Role</span>
          <select
            name="role"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            defaultValue="editor"
          >
            <option value="editor">editor</option>
            <option value="viewer">viewer</option>
          </select>
        </label>
        <Field
          name="temporary_password"
          label="Temporary password"
          type="password"
          defaultValue="TempPass123!"
          required
        />
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-bank-teal px-4 py-2 text-sm font-medium text-white"
          >
            Create customer
          </button>
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">CIF</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <Fragment key={c.id}>
                <tr className="border-t border-slate-100">
                  <td className="px-4 py-3">{c.username}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{c.role}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.cif ?? "—"}</td>
                  <td className="px-4 py-3 space-x-2">
                    {c.cif ? (
                      <>
                        <button
                          type="button"
                          onClick={() => loadAccountsForCif(c.cif!)}
                          className="text-teal-700 hover:underline"
                        >
                          {expandedCif === c.cif ? "Hide accounts" : "View accounts"}
                        </button>
                        <Link
                          href={`/accounts?cif=${encodeURIComponent(c.cif)}`}
                          className="text-bank-navy hover:underline"
                        >
                          Open in Accounts
                        </Link>
                      </>
                    ) : (
                      <span className="text-slate-400">No CIF</span>
                    )}
                  </td>
                </tr>
                {expandedCif === c.cif && c.cif && (
                  <tr key={`${c.id}-accounts`} className="bg-slate-50">
                    <td colSpan={5} className="px-4 py-4">
                      {accountsLoading ? (
                        <p className="text-slate-500">Loading accounts…</p>
                      ) : accounts.length === 0 ? (
                        <p className="text-slate-500">No accounts for {c.cif}.</p>
                      ) : (
                        <ul className="space-y-2">
                          {accounts.map((a) => (
                            <li
                              key={a.account_number}
                              className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                            >
                              <span className="font-mono">{a.account_number}</span>
                              <span>{a.product_category}</span>
                              <span>Balance: {a.ledger_balance}</span>
                              <span className="text-slate-500">{a.status}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        {...rest}
      />
    </label>
  );
}
