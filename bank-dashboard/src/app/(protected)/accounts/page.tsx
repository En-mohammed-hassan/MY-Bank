"use client";

import { FormEvent, useState } from "react";
import { apiFetch, coreApi } from "@/lib/api";
import { getSessionUser, hasRole } from "@/lib/auth";
import type { Account, Customer } from "@/lib/types";

export default function AccountsPage() {
  const user = getSessionUser();
  const canTransfer = hasRole(user, "admin", "supervisor");
  const [cif, setCif] = useState("CIF10001");
  const [accountNumber, setAccountNumber] = useState("ACC-10001-01");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transferMsg, setTransferMsg] = useState<string | null>(null);

  async function loadCustomer(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setCustomer(null);
    setAccount(null);
    try {
      const c = await apiFetch<Customer>(coreApi, `/core/customers/${cif}`);
      setCustomer(c);
      const list = await apiFetch<{ accounts: Account[] }>(
        coreApi,
        `/core/customers/${cif}/accounts`,
      );
      if (list.accounts.length > 0) {
        setAccountNumber(list.accounts[0].account_number);
        setAccount(list.accounts[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    }
  }

  async function loadAccount(num: string) {
    setError(null);
    try {
      const a = await apiFetch<Account>(coreApi, `/core/accounts/${num}`);
      setAccount(a);
      setAccountNumber(num);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account not found");
    }
  }

  async function runTransfer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTransferMsg(null);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch(coreApi, "/core/transfers/internal", {
        method: "POST",
        body: JSON.stringify({
          from_account: form.get("from_account"),
          to_account: form.get("to_account"),
          amount: form.get("amount"),
          currency: "USD",
          reference: form.get("reference") || "dashboard-transfer",
          idempotency_key: `dash-${Date.now()}`,
        }),
      });
      setTransferMsg("Transfer completed.");
      await loadAccount(accountNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-bank-navy">Accounts</h1>
      <p className="mt-1 text-slate-600">View customers and accounts. Transfers: admin & supervisor only.</p>

      <form onSubmit={loadCustomer} className="mt-6 flex flex-wrap gap-3">
        <input
          value={cif}
          onChange={(e) => setCif(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="CIF"
        />
        <button type="submit" className="rounded-lg bg-bank-navy px-4 py-2 text-sm text-white">
          Load customer
        </button>
      </form>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {transferMsg && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{transferMsg}</p>
      )}

      {customer && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">{customer.full_name}</h2>
          <p className="text-sm text-slate-600">
            {customer.cif} · {customer.customer_type} · {customer.status}
          </p>
        </div>
      )}

      {account && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Account {account.account_number}</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Item label="Ledger balance" value={account.ledger_balance} />
            <Item label="Available" value={account.available_balance} />
            <Item label="On hold" value={account.hold_amount} />
            <Item label="Product" value={account.product_category} />
          </dl>
        </div>
      )}

      {canTransfer ? (
        <form
          onSubmit={runTransfer}
          className="mt-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 font-semibold">Internal transfer</h2>
          <Field name="from_account" label="From" defaultValue="ACC-10001-02" />
          <Field name="to_account" label="To" defaultValue="ACC-10001-01" />
          <Field name="amount" label="Amount" defaultValue="10.00" />
          <Field name="reference" label="Reference" defaultValue="dashboard" />
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-bank-teal px-4 py-2 text-sm text-white">
              Submit transfer
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-8 text-sm text-slate-500">
          Transfers are hidden for your role (retail). API will return 403 if attempted.
        </p>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  );
}
