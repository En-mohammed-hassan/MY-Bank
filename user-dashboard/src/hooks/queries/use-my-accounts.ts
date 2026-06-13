import { useQuery } from "@tanstack/react-query";
import { coreFetch } from "@/lib/api";
import { coreKeys } from "@/lib/query/query-keys";
import type { AccountListResponse, CoreCustomer } from "@/types";

export function useCoreCustomer(cif: string | null | undefined) {
  return useQuery({
    queryKey: coreKeys.customer(cif ?? ""),
    queryFn: () => coreFetch<CoreCustomer>(`/core/customers/${cif}`),
    enabled: !!cif,
  });
}

export function useMyAccounts(cif: string | null | undefined) {
  return useQuery({
    queryKey: coreKeys.accounts(cif ?? ""),
    queryFn: () => coreFetch<AccountListResponse>(`/core/customers/${cif}/accounts`),
    enabled: !!cif,
  });
}
