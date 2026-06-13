"use client";

import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { useSession } from "@/hooks/use-session";
import { hasRole } from "@/lib/auth";
import { CreateStaffForm } from "./components/create-staff-form";
import { StaffTable } from "./components/staff-table";

export default function StaffPage() {
  const { user } = useSession();
  const canCreate = hasRole(user, "admin", "supervisor");

  return (
    <PageContainer>
      <PageHeader
        title="Staff users"
        description="Profiles from users-api (linked to Keycloak)."
      />
      {canCreate && (
        <div className="mb-8">
          <CreateStaffForm />
        </div>
      )}
      <StaffTable />
    </PageContainer>
  );
}
