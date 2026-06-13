"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/states";
import { useCoreCustomer } from "@/hooks/queries/use-my-accounts";

export function BankingSummary({ cif }: { cif: string }) {
  const { data, isLoading, isError, error, refetch } = useCoreCustomer(cif);

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;
  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load banking profile"}
        onRetry={() => refetch()}
      />
    );
  }
  if (!data) return null;

  return (
    <Card>
      <CardHeader><CardTitle>Banking profile</CardTitle></CardHeader>
      <CardContent>
        <p className="font-semibold">{data.full_name}</p>
        <p className="text-sm text-muted-foreground">
          {data.cif} · {data.customer_type} · {data.status}
        </p>
      </CardContent>
    </Card>
  );
}
