"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, usersApi } from "@/lib/api";
import { getSessionUser, hasRole } from "@/lib/auth";
import type { StaffListResponse, StaffUser } from "@/lib/types";

export default function StaffPage() {
  const user = getSessionUser();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const canCreate = hasRole(user, "admin", "supervisor");

  async function loadStaff() {
    setError(null);
    try {
      const data = await apiFetch<StaffListResponse>(usersApi, "/bank-users?status=active");
      setStaff(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load staff");
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch(usersApi, "/bank-users", {
        method: "POST",
        body: JSON.stringify({
          username: form.get("username"),
          email: form.get("email"),
          full_name: form.get("full_name"),
          role: form.get("role"),
          department: form.get("department") || null,
          temporary_password: form.get("temporary_password"),
        }),
      });
      setMsg("Staff user created.");
      e.currentTarget.reset();
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-bank-navy">Staff users</h1>
      <p className="mt-1 text-slate-600">Profiles from users-api (linked to Keycloak).</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {msg && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      {canCreate && (
        <form
          onSubmit={onCreate}
          className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 font-semibold">Create staff user</h2>
          <Input name="username" label="Username" placeholder="ali.retail" required />
          <Input name="email" label="Email" type="email" placeholder="ali@bank.example" required />
          <Input name="full_name" label="Full name" placeholder="Ali Retail" required />
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Role</span>
            <select
              name="role"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              defaultValue="retail"
            >
              <option value="admin">admin</option>
              <option value="supervisor">supervisor</option>
              <option value="retail">retail</option>
            </select>
          </label>
          <Input name="department" label="Department" placeholder="Branch 1" />
          <Input
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
              Create
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{s.username}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{s.role}</span>
                </td>
                <td className="px-4 py-3">{s.department ?? "—"}</td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No staff users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Input({
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
