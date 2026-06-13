import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, usersFetch } from "@/lib/api";
import { staffKeys } from "@/lib/query/query-keys";
import type { CreateStaffInput, StaffUser } from "@/types";

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStaffInput) =>
      usersFetch<StaffUser>("/bank-users", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      toast.success("Staff user created");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Create failed");
    },
  });
}
