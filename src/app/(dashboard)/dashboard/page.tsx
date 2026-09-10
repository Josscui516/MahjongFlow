import { DashboardView, loadDashboardSnapshot } from "@/features/dashboard";
import { createDashboardTaskQuery } from "@/features/dashboard/task-query-adapter";
import { listTasks } from "@/features/tasks/core/service";
import { classifyTaskDueRisk } from "@/features/tasks/due-risk";
import { requireBackendUser } from "@/lib/auth/authorization";
import { createRealUpcomingEventsPort } from "@/features/dashboard/upcoming-events/real-adapter";

export default async function DashboardPage() {
  const access = await requireBackendUser();
  const taskQuery = createDashboardTaskQuery({ classifyDueRisk: classifyTaskDueRisk, listTasks });
  const now = new Date();
  const [snapshot, upcomingEvents] = await Promise.all([
    loadDashboardSnapshot(access.userId, now, taskQuery),
    createRealUpcomingEventsPort().listUpcoming(now),
  ]);
  return <DashboardView snapshot={snapshot} upcomingEvents={upcomingEvents} />;
}
