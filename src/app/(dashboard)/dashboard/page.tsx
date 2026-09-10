import { DashboardView, loadDashboardSnapshot } from "@/features/dashboard";
import { createDashboardTaskQuery } from "@/features/dashboard/task-query-adapter";
import { listTasks } from "@/features/tasks/core/service";
import { classifyTaskDueRisk } from "@/features/tasks/due-risk";
import { requireBackendUser } from "@/lib/auth/authorization";

export default async function DashboardPage() {
  const access = await requireBackendUser();
  const taskQuery = createDashboardTaskQuery({ classifyDueRisk: classifyTaskDueRisk, listTasks });
  const snapshot = await loadDashboardSnapshot(access.userId, new Date(), taskQuery);
  return <DashboardView snapshot={snapshot} upcomingEvents={{ state: "not_connected" }} />;
}
