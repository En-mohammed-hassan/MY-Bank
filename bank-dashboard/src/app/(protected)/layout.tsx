import { Shell } from "@/components/layout/shell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
