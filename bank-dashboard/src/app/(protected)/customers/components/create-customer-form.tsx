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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateCustomer } from "@/hooks/mutations/use-create-customer";
import { createCustomerSchema, type CreateCustomerFormValues } from "@/lib/schemas/forms";

export function CreateCustomerForm() {
  const createCustomer = useCreateCustomer();
  const form = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      username: "",
      email: "",
      full_name: "",
      role: "editor",
      cif: "",
      temporary_password: "TempPass123!",
    },
  });

  function onSubmit(values: CreateCustomerFormValues) {
    createCustomer.mutate(
      {
        ...values,
        cif: values.cif?.trim() || null,
      },
      {
        onSuccess: () =>
          form.reset({
            username: "",
            email: "",
            full_name: "",
            cif: "",
            role: "editor",
            temporary_password: "TempPass123!",
          }),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create customer login</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="mohammad.c" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem><FormLabel>Full name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="cif" render={({ field }) => (
              <FormItem><FormLabel>CIF (optional)</FormLabel><FormControl><Input placeholder="CIF10001" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="editor">editor</SelectItem>
                    <SelectItem value="viewer">viewer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="temporary_password" render={({ field }) => (
              <FormItem><FormLabel>Temporary password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? "Creating…" : "Create customer"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
