import type { TaskRecordDTO } from "@/features/tasks/core/contracts";

export type DashboardTaskSectionKey =
  | "mine"
  | "unfinished"
  | "dueSoon"
  | "overdue";

export type DashboardTaskSection = Readonly<{
  items: readonly TaskRecordDTO[];
  key: DashboardTaskSectionKey;
  total: number;
}>;

export type DashboardTaskSectionResult =
  | Readonly<{ ok: true; section: DashboardTaskSection }>
  | Readonly<{
      code: "PERMISSION_DENIED" | "SYSTEM_ERROR" | "UPSTREAM_NOT_CONNECTED";
      key: DashboardTaskSectionKey;
      ok: false;
    }>;

export type DashboardTaskQuery = Readonly<{
  querySection(input: Readonly<{
    key: DashboardTaskSectionKey;
    now: Date;
    userId: string;
  }>): Promise<DashboardTaskSectionResult>;
}>;

export type DashboardSnapshot = Readonly<{
  capturedAt: string;
  sections: readonly DashboardTaskSectionResult[];
}>;
