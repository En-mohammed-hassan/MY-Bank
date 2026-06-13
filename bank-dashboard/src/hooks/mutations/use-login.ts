import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { login } from "@/lib/auth";
import { usersApiBase } from "@/lib/api";
import { useSession } from "@/hooks/use-session";

export function useLogin() {
  const router = useRouter();
  const { refresh } = useSession();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => {
      if (!usersApiBase) throw new Error("NEXT_PUBLIC_USERS_API_URL is not set");
      return login(usersApiBase, username, password);
    },
    onSuccess: () => {
      refresh();
      router.replace("/dashboard");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Login failed");
    },
  });
}
