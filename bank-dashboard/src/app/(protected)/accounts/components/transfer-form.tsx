"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import { hasRole } from "@/lib/auth";
import { useTransfer } from "@/hooks/mutations/use-transfer";
import { transferSchema, type TransferFormValues } from "@/lib/schemas/forms";

export function TransferForm({ defaultFrom }: { defaultFrom: string }) {
  const { user } = useSession();
  const canTransfer = hasRole(user, "admin", "supervisor");
  const transfer = useTransfer();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_account: defaultFrom,
      to_account: "ACC-10001-01",
      amount: "10.00",
      reference: "dashboard",
    },
  });

  if (!canTransfer) {
    return (
      <p className="text-sm text-muted-foreground">
        Transfers are hidden for your role (retail). API will return 403 if attempted.
      </p>
    );
  }

  function onSubmit(values: TransferFormValues) {
    transfer.mutate({
      from_account: values.from_account,
      to_account: values.to_account,
      amount: values.amount,
      currency: "USD",
      reference: values.reference || "dashboard-transfer",
      idempotency_key: `dash-${Date.now()}`,
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Internal transfer</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="from_account" render={({ field }) => (
              <FormItem><FormLabel>From</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="to_account" render={({ field }) => (
              <FormItem><FormLabel>To</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem><FormLabel>Amount</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="reference" render={({ field }) => (
              <FormItem><FormLabel>Reference</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={transfer.isPending}>
                {transfer.isPending ? "Submitting…" : "Submit transfer"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
