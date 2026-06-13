"use client";

import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { CreateCustomerForm } from "./components/create-customer-form";
import { CustomersTable } from "./components/customers-table";

export default function CustomersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Retail customers"
        description="Portal users (editor / viewer). Link a CIF to view core banking accounts."
      />
      <div className="mb-8">
        <CreateCustomerForm />
      </div>
      <CustomersTable />
    </PageContainer>
  );
}
