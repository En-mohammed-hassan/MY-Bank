"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/states";
import { useSession } from "@/hooks/use-session";
import { hasRole } from "@/lib/auth";
import { useMyProfile } from "@/hooks/queries/use-my-profile";
import { useUpdateProfile } from "@/hooks/mutations/use-update-profile";
import { profileUpdateSchema, type ProfileUpdateFormValues } from "@/lib/schemas/forms";
import { BankingSummary } from "./banking-summary";
import { AccountsList } from "./accounts-list";

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function ProfileCard() {
  const { user } = useSession();
  const { data: profile, isLoading, isError, error, refetch } = useMyProfile();
  const canEdit = hasRole(user, "editor");
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { full_name: "" },
  });

  useEffect(() => {
    if (profile) form.reset({ full_name: profile.full_name });
  }, [profile, form]);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load profile"}
        onRetry={() => refetch()}
      />
    );
  }
  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My profile</CardTitle>
        <p className="text-sm text-muted-foreground">
          Role: <Badge variant="secondary">{user?.roles.join(", ")}</Badge>
          {canEdit ? " — you can edit" : " — read only"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProfileRow label="Username" value={profile.username} />
        <ProfileRow label="Email" value={profile.email} />
        <ProfileRow label="CIF" value={profile.cif ?? "—"} />
        <ProfileRow label="Status" value={profile.status} />
        {canEdit ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => updateProfile.mutate(v.full_name))}
              className="space-y-3 border-t pt-4"
            >
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving…" : "Save"}
              </Button>
            </form>
          </Form>
        ) : (
          <ProfileRow label="Full name" value={profile.full_name} />
        )}
      </CardContent>
    </Card>
  );
}

export function HomeContent() {
  const { data: profile } = useMyProfile();

  return (
    <div className="space-y-6">
      <ProfileCard />
      {profile?.cif && (
        <>
          <BankingSummary cif={profile.cif} />
          <AccountsList cif={profile.cif} />
        </>
      )}
    </div>
  );
}
