"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/states";
import { useCustomerAccounts, useCustomerByCif } from "@/hooks/queries/use-core-data";
import type { Account } from "@/types";
import { AccountDetails } from "./account-details";
import { TransferForm } from "./transfer-form";

export function AccountsView() {
  const searchParams = useSearchParams();
  const [cif, setCif] = useState(() => searchParams.get("cif") ?? "CIF10001");
  const [activeCif, setActiveCif] = useState<string | null>(() => searchParams.get("cif"));
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const customerQuery = useCustomerByCif(activeCif);
  const accountsQuery = useCustomerAccounts(activeCif);

  useEffect(() => {
    const fromUrl = searchParams.get("cif");
    if (fromUrl) {
      setCif(fromUrl);
      setActiveCif(fromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (accountsQuery.data?.accounts.length && !selectedAccount) {
      setSelectedAccount(accountsQuery.data.accounts[0]);
    }
  }, [accountsQuery.data, selectedAccount]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveCif(cif.trim() || null);
    setSelectedAccount(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Look up customer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="cif" className="sr-only">CIF</Label>
              <Input id="cif" value={cif} onChange={(e) => setCif(e.target.value)} placeholder="CIF10001" />
            </div>
            <Button type="submit">Load customer</Button>
          </form>
        </CardContent>
      </Card>

      {activeCif && customerQuery.isLoading && <Skeleton className="h-24 w-full rounded-xl" />}
      {customerQuery.isError && (
        <ErrorState message={customerQuery.error.message} onRetry={() => customerQuery.refetch()} />
      )}
      {customerQuery.data && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold">{customerQuery.data.full_name}</h2>
            <p className="text-sm text-muted-foreground">
              {customerQuery.data.cif} · {customerQuery.data.customer_type} · {customerQuery.data.status}
            </p>
          </CardContent>
        </Card>
      )}

      {activeCif && accountsQuery.isLoading && <Skeleton className="h-32 w-full rounded-xl" />}
      {accountsQuery.data && accountsQuery.data.accounts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Accounts</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {accountsQuery.data.accounts.map((a: Account) => (
              <Button
                key={a.account_number}
                type="button"
                variant={selectedAccount?.account_number === a.account_number ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAccount(a)}
              >
                {a.account_number}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedAccount && <AccountDetails account={selectedAccount} />}
      {selectedAccount && <TransferForm defaultFrom={selectedAccount.account_number} />}
    </div>
  );
}
