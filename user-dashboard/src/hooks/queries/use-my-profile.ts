import { useQuery } from "@tanstack/react-query";
import { customerFetch } from "@/lib/api";
import { profileKeys } from "@/lib/query/query-keys";
import type { CustomerProfile } from "@/types";

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => customerFetch<CustomerProfile>("/customers/me"),
  });
}
