"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/feedback/states";
import { useCustomersList } from "@/hooks/queries/use-customers-list";
import { CustomerAccountsPanel } from "./customer-accounts-panel";

export function CustomersTable() {
  const { data, isLoading, isError, error, refetch } = useCustomersList();
  const [expandedCif, setExpandedCif] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card><CardContent className="p-0"><TableSkeleton rows={4} cols={5} /></CardContent></Card>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load customers"}
        onRetry={() => refetch()}
      />
    );
  }

  const items = data?.items ?? [];

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>CIF</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => (
              <Fragment key={c.id}>
                <TableRow>
                  <TableCell className="font-medium">{c.username}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell><Badge variant="secondary">{c.role}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{c.cif ?? "—"}</TableCell>
                  <TableCell className="space-x-2">
                    {c.cif ? (
                      <>
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0"
                          onClick={() => setExpandedCif(expandedCif === c.cif ? null : c.cif)}
                        >
                          {expandedCif === c.cif ? "Hide accounts" : "View accounts"}
                        </Button>
                        <Link href={`/accounts?cif=${encodeURIComponent(c.cif)}`} className="text-sm text-primary hover:underline">
                          Open in Accounts
                        </Link>
                      </>
                    ) : (
                      <span className="text-muted-foreground text-sm">No CIF</span>
                    )}
                  </TableCell>
                </TableRow>
                {expandedCif === c.cif && c.cif && (
                  <TableRow key={`${c.id}-accounts`}>
                    <TableCell colSpan={5} className="bg-muted/30">
                      <CustomerAccountsPanel cif={c.cif} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState title="No customers yet" description="Create a customer login above." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
