import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, customerFetch } from "@/lib/api";
import { customerKeys } from "@/lib/query/query-keys";
import type { CreateCustomerInput, CustomerProfile } from "@/types";

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      customerFetch<CustomerProfile>("/customers", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success("Customer created");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Create failed");
    },
  });
}
