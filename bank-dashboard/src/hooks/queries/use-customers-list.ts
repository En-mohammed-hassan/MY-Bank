import { useQuery } from "@tanstack/react-query";
import { customerFetch } from "@/lib/api";
import { customerKeys } from "@/lib/query/query-keys";
import type { CustomerListResponse } from "@/types";

export function useCustomersList() {
  return useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => customerFetch<CustomerListResponse>("/customers"),
  });
}
