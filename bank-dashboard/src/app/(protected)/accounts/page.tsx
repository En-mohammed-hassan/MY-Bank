import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/feedback/states";
import { AccountsView } from "./components/accounts-view";

export default function AccountsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Accounts"
        description="View customers and accounts. Transfers: admin and supervisor only."
      />
      <Suspense fallback={<PageSkeleton />}>
        <AccountsView />
      </Suspense>
    </PageContainer>
  );
}
