import type {
  DashboardSnapshot,
  DashboardTaskQuery,
  DashboardTaskSectionKey,
  DashboardTaskSectionResult,
} from "./contracts";

export const DASHBOARD_SECTION_KEYS = [
  "mine",
  "unfinished",
  "dueSoon",
  "overdue",
] as const satisfies readonly DashboardTaskSectionKey[];

export async function loadDashboardSnapshot(
  userId: string,
  now: Date,
  query: DashboardTaskQuery,
): Promise<DashboardSnapshot> {
  const capturedAt = now.toISOString();
  const sections = await Promise.all(
    DASHBOARD_SECTION_KEYS.map(async (key): Promise<DashboardTaskSectionResult> => {
      try {
        return await query.querySection({ key, now, userId });
      } catch {
        return { code: "SYSTEM_ERROR", key, ok: false };
      }
    }),
  );

  return { capturedAt, sections };
}
