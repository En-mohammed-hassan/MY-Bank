import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, coreFetch } from "@/lib/api";

export function useSeedDemo() {
  return useMutation({
    mutationFn: () => coreFetch<void>("/core/seed", { method: "POST" }),
    onSuccess: () => toast.success("Demo data loaded (CIF10001, CIF10002)"),
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Seed failed"),
  });
}
