import { TASK_STATUSES, type TaskStatus } from "../core/contracts";

export const TASK_SORTS = ["due_soonest", "due_latest", "updated_recent"] as const;
export type TaskSort = (typeof TASK_SORTS)[number];
export type TaskStatusFilter = "all" | TaskStatus;
export type TaskListCriteria = Readonly<{ search: string; sort: TaskSort; status: TaskStatusFilter }>;

type RawSearchParams = Readonly<{ q?: string | string[]; sort?: string | string[]; status?: string | string[] }>;

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export function parseTaskListCriteria(params: RawSearchParams): TaskListCriteria {
  const search = (first(params.q) ?? "").trim().slice(0, 100);
  const rawSort = first(params.sort);
  const rawStatus = first(params.status);
  const sort = TASK_SORTS.includes(rawSort as TaskSort) ? rawSort as TaskSort : "due_soonest";
  const status = TASK_STATUSES.includes(rawStatus as TaskStatus) ? rawStatus as TaskStatus : "all";
  return { search, sort, status };
}

export function hasTaskListFilters(criteria: TaskListCriteria) {
  return criteria.search.length > 0 || criteria.status !== "all" || criteria.sort !== "due_soonest";
}

export function buildTaskListHref(criteria: TaskListCriteria) {
  const params = new URLSearchParams();
  if (criteria.search) params.set("q", criteria.search);
  if (criteria.status !== "all") params.set("status", criteria.status);
  if (criteria.sort !== "due_soonest") params.set("sort", criteria.sort);
  const query = params.toString();
  return query ? `/tasks?${query}` : "/tasks";
}
