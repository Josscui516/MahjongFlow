import { DashboardView, loadDashboardSnapshot } from "@/features/dashboard";
import { createUnconnectedDashboardTaskQuery } from "@/features/dashboard/unconnected-query";
import { requireBackendUser } from "@/lib/auth/authorization";

export default async function DashboardPage() {
  const access = await requireBackendUser();
  const snapshot = await loadDashboardSnapshot(access.userId, new Date(), createUnconnectedDashboardTaskQuery());
  return <DashboardView snapshot={snapshot} upcomingEvents={{ state: "not_connected" }} />;
}
