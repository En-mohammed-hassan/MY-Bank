"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { useMyAccounts } from "@/hooks/queries/use-my-accounts";

export function AccountsList({ cif }: { cif: string }) {
  const { data, isLoading, isError, error, refetch } = useMyAccounts(cif);

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load accounts"}
        onRetry={() => refetch()}
      />
    );
  }

  const accounts = data?.accounts ?? [];

  return (
    <Card>
      <CardHeader><CardTitle>My accounts</CardTitle></CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <EmptyState title="No accounts linked" description={`No accounts found for ${cif}.`} />
        ) : (
          <ul className="space-y-3">
            {accounts.map((a) => (
              <li key={a.account_number} className="rounded-lg border p-4">
                <p className="font-mono text-sm">{a.account_number}</p>
                <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Product</dt><dd className="font-medium">{a.product_category}</dd></div>
                  <div><dt className="text-muted-foreground">Status</dt><dd className="font-medium">{a.status}</dd></div>
                  <div><dt className="text-muted-foreground">Ledger balance</dt><dd className="font-medium">{a.ledger_balance}</dd></div>
                  <div><dt className="text-muted-foreground">Available</dt><dd className="font-medium">{a.available_balance}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
