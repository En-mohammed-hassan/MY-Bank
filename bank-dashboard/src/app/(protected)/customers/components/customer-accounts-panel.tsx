"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/states";
import { useCustomerAccounts } from "@/hooks/queries/use-core-data";

export function CustomerAccountsPanel({ cif }: { cif: string }) {
  const { data, isLoading, isError, error, refetch } = useCustomerAccounts(cif);

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load accounts"}
        onRetry={() => refetch()}
      />
    );
  }

  const accounts = data?.accounts ?? [];
  if (accounts.length === 0) {
    return <p className="text-sm text-muted-foreground">No accounts for {cif}.</p>;
  }

  return (
    <ul className="space-y-2">
      {accounts.map((a) => (
        <li key={a.account_number} className="flex flex-wrap justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
          <span className="font-mono">{a.account_number}</span>
          <span>{a.product_category}</span>
          <span>Balance: {a.ledger_balance}</span>
          <span className="text-muted-foreground">{a.status}</span>
        </li>
      ))}
    </ul>
  );
}
