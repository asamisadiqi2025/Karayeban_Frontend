import { DashboardShell } from "@/components/client/layout/dashboard-shell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
