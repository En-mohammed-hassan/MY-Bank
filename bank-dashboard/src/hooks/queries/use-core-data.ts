import { useQuery } from "@tanstack/react-query";
import { coreFetch } from "@/lib/api";
import { coreKeys } from "@/lib/query/query-keys";
import type { Account, AccountListResponse, CoreCustomer } from "@/types";

export function useCustomerByCif(cif: string | null) {
  return useQuery({
    queryKey: coreKeys.customer(cif ?? ""),
    queryFn: () => coreFetch<CoreCustomer>(`/core/customers/${cif}`),
    enabled: !!cif,
  });
}

export function useCustomerAccounts(cif: string | null) {
  return useQuery({
    queryKey: coreKeys.accounts(cif ?? ""),
    queryFn: () => coreFetch<AccountListResponse>(`/core/customers/${cif}/accounts`),
    enabled: !!cif,
  });
}

export function useAccount(accountNumber: string | null) {
  return useQuery({
    queryKey: coreKeys.account(accountNumber ?? ""),
    queryFn: () => coreFetch<Account>(`/core/accounts/${accountNumber}`),
    enabled: !!accountNumber,
  });
}
