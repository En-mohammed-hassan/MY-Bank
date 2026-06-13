"use client";

import { Badge } from "@/components/ui/badge";
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
import { useStaffList } from "@/hooks/queries/use-staff-list";

export function StaffTable() {
  const { data, isLoading, isError, error, refetch } = useStaffList();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton rows={5} cols={4} />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load staff"}
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
              <TableHead>Department</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.username}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{s.role}</Badge>
                </TableCell>
                <TableCell>{s.department ?? "—"}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <EmptyState title="No staff users yet" description="Create a staff user above to get started." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
