import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, coreFetch } from "@/lib/api";
import { coreKeys } from "@/lib/query/query-keys";
import type { TransferInput } from "@/types";

export function useTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TransferInput) =>
      coreFetch("/core/transfers/internal", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreKeys.all });
      toast.success("Transfer completed");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Transfer failed");
    },
  });
}
