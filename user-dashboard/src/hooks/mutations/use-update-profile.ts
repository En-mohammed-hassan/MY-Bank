import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, customerFetch } from "@/lib/api";
import { profileKeys } from "@/lib/query/query-keys";
import type { CustomerProfile } from "@/types";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (full_name: string) =>
      customerFetch<CustomerProfile>("/customers/me", {
        method: "PATCH",
        body: JSON.stringify({ full_name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Update failed");
    },
  });
}
