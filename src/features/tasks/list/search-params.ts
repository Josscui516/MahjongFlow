import { TASK_STATUSES, type TaskStatus } from "../core/contracts";

export const TASK_SORTS = ["due_soonest", "due_latest", "updated_recent"] as const;
export type TaskSort = (typeof TASK_SORTS)[number];
export type TaskStatusFilter = "all" | TaskStatus;
export const TASK_PAGE_SIZE = 20;
export type TaskFilterCriteria = Readonly<{ assigneeId?: string; dueFrom?: string; dueTo?: string; eventId?: string; page: number; pageSize: number; search: string; sort: TaskSort; status: TaskStatusFilter }>;
export type TaskFilterParseResult = Readonly<{ criteria: TaskFilterCriteria; ok: true }> | Readonly<{ errors: readonly string[]; ok: false }>;
export type RawTaskSearchParams = Readonly<{ assigneeId?: string | string[]; dueFrom?: string | string[]; dueTo?: string | string[]; eventId?: string | string[]; page?: string | string[]; q?: string | string[]; sort?: string | string[]; status?: string | string[] }>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
function validDate(value: string) { if (!ISO_DATE.test(value)) return false; const date = new Date(`${value}T00:00:00.000Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }

export function parseTaskFilterCriteria(params: RawTaskSearchParams): TaskFilterParseResult {
  const errors: string[] = [];
  const search = (first(params.q) ?? "").trim().slice(0, 100);
  const rawSort = first(params.sort); const rawStatus = first(params.status);
  const assigneeId = first(params.assigneeId) || undefined; const eventId = first(params.eventId) || undefined;
  const dueFrom = first(params.dueFrom) || undefined; const dueTo = first(params.dueTo) || undefined;
  const rawPage = first(params.page); const page = rawPage ? Number(rawPage) : 1;
  if (assigneeId && !UUID.test(assigneeId)) errors.push("Select a valid assignee.");
  if (eventId && !UUID.test(eventId)) errors.push("Enter a valid event identifier.");
  if (dueFrom && !validDate(dueFrom)) errors.push("Enter a valid start date.");
  if (dueTo && !validDate(dueTo)) errors.push("Enter a valid end date.");
  if (dueFrom && dueTo && validDate(dueFrom) && validDate(dueTo) && dueFrom > dueTo) errors.push("The start date must be on or before the end date.");
  if (rawStatus && rawStatus !== "all" && !TASK_STATUSES.includes(rawStatus as TaskStatus)) errors.push("Select a valid task status.");
  if (rawSort && !TASK_SORTS.includes(rawSort as TaskSort)) errors.push("Select a valid sort order.");
  if (!Number.isSafeInteger(page) || page < 1) errors.push("Select a valid task page.");
  if (errors.length) return { errors, ok: false };
  return { criteria: { assigneeId, dueFrom, dueTo, eventId, page, pageSize: TASK_PAGE_SIZE, search, sort: (rawSort as TaskSort | undefined) ?? "due_soonest", status: (rawStatus as TaskStatusFilter | undefined) ?? "all" }, ok: true };
}

export function hasTaskListFilters(criteria: TaskFilterCriteria) { return Boolean(criteria.assigneeId || criteria.dueFrom || criteria.dueTo || criteria.eventId) || criteria.search.length > 0 || criteria.status !== "all" || criteria.sort !== "due_soonest"; }
export function buildTaskListHref(criteria: TaskFilterCriteria, page = criteria.page) { const params = new URLSearchParams(); if (criteria.search) params.set("q", criteria.search); if (criteria.assigneeId) params.set("assigneeId", criteria.assigneeId); if (criteria.status !== "all") params.set("status", criteria.status); if (criteria.dueFrom) params.set("dueFrom", criteria.dueFrom); if (criteria.dueTo) params.set("dueTo", criteria.dueTo); if (criteria.eventId) params.set("eventId", criteria.eventId); if (criteria.sort !== "due_soonest") params.set("sort", criteria.sort); if (page > 1) params.set("page", String(page)); const query = params.toString(); return query ? `/tasks?${query}` : "/tasks"; }

export const parseTaskListCriteria = parseTaskFilterCriteria;
export type TaskListCriteria = TaskFilterCriteria;
