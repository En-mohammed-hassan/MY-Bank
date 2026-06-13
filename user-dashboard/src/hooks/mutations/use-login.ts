import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { customerApiBase } from "@/lib/api";
import { login } from "@/lib/auth";
import { useSession } from "@/hooks/use-session";

export function useLogin() {
  const router = useRouter();
  const { refresh } = useSession();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => {
      if (!customerApiBase) throw new Error("NEXT_PUBLIC_CUSTOMER_API_URL is not set");
      return login(customerApiBase, username, password);
    },
    onSuccess: () => {
      refresh();
      router.replace("/home");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Login failed");
    },
  });
}
