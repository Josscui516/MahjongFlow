import type { TaskRecordDTO, TaskStatus } from "@/features/tasks/core/contracts";

import type {
  DashboardTaskQuery,
  DashboardTaskSectionKey,
  DashboardTaskSectionResult,
} from "./contracts";

type ProviderCriteria = Readonly<{
  assigneeId?: string;
  page: number;
  pageSize: number;
  search: string;
  sort: "due_soonest";
  status: TaskStatus;
}>;

const DASHBOARD_PAGE_SIZE = 100;

type ProviderResult =
  | Readonly<{ items: readonly TaskRecordDTO[]; ok: true; total: number }>
  | Readonly<{ code: "PERMISSION_DENIED" | "SYSTEM_ERROR"; ok: false }>;

type DueRiskResult =
  | Readonly<{ ok: true; value: "completed" | "dueSoon" | "normal" | "overdue" }>
  | Readonly<{ ok: false; value: "invalid" }>;

export type DashboardTaskQueryDependencies = Readonly<{
  classifyDueRisk(input: Readonly<{
    dueDate: string;
    now: Date;
    status: TaskStatus;
  }>): DueRiskResult;
  listTasks(criteria: ProviderCriteria): Promise<ProviderResult>;
}>;

function stableMerge(results: readonly Extract<ProviderResult, { ok: true }>[]) {
  const byId = new Map<string, TaskRecordDTO>();
  results.forEach(({ items }) => items.forEach((item) => byId.set(item.id, item)));
  return [...byId.values()].sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.id.localeCompare(right.id));
}

function failure(key: DashboardTaskSectionKey, results: readonly ProviderResult[]): DashboardTaskSectionResult | null {
  const failed = results.find((result) => !result.ok);
  if (!failed || failed.ok) return null;
  return { code: failed.code, key, ok: false };
}

export function createDashboardTaskQuery({ classifyDueRisk, listTasks }: DashboardTaskQueryDependencies): DashboardTaskQuery {
  async function listUnfinishedStatus(status: Exclude<TaskStatus, "completed">, assigneeId?: string): Promise<readonly ProviderResult[]> {
    const criteria = { assigneeId, pageSize: DASHBOARD_PAGE_SIZE, search: "", sort: "due_soonest" as const, status };
    const first = await listTasks({ ...criteria, page: 1 });
    if (!first.ok) return [first];
    const pageCount = Math.ceil(first.total / DASHBOARD_PAGE_SIZE);
    if (pageCount <= 1) return [first];
    const remaining = await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => listTasks({ ...criteria, page: index + 2 })));
    return [first, ...remaining];
  }

  return {
    async querySection({ key, now, userId }) {
      const assigneeId = key === "mine" ? userId : undefined;
      const pages = await Promise.all([
        listUnfinishedStatus("not_started", assigneeId),
        listUnfinishedStatus("in_progress", assigneeId),
      ]);
      const results = pages.flat();
      const failed = failure(key, results);
      if (failed) return failed;

      const unfinished = stableMerge(results as readonly Extract<ProviderResult, { ok: true }>[]);
      let items = unfinished;
      if (key === "dueSoon" || key === "overdue") {
        items = [];
        for (const task of unfinished) {
          const risk = classifyDueRisk({ dueDate: task.dueDate, now, status: task.status });
          if (!risk.ok) return { ok: false, code: "SYSTEM_ERROR", key };
          if (risk.value === key) items.push(task);
        }
      }

      return { ok: true, section: { items, key, total: items.length } };
    },
  };
}
