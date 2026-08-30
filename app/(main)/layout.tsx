import { DashboardShell } from "@/components/client/layout/dashboard-shell";
import { AuthGuard } from "@/components/client/auth/auth-guard";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
