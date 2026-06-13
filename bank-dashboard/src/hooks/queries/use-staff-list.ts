import { useQuery } from "@tanstack/react-query";
import { usersFetch } from "@/lib/api";
import { staffKeys } from "@/lib/query/query-keys";
import type { StaffListResponse } from "@/types";

export function useStaffList(status = "active") {
  return useQuery({
    queryKey: staffKeys.list(status),
    queryFn: () => usersFetch<StaffListResponse>(`/bank-users?status=${status}`),
  });
}
