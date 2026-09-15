import { buildTaskListHref, parseTaskFilterCriteria } from "./search-params";
export function taskListReturn(value?: string): string {
  if (!value || !/^\/tasks(?:\?|$)/.test(value)) return "/tasks";
  const query = value.split("?")[1] ?? "";
  const parsed = parseTaskFilterCriteria(Object.fromEntries(new URLSearchParams(query)));
  return parsed.ok ? buildTaskListHref(parsed.criteria) : "/tasks";
}
export function taskDetailHref(id: string, returnTo = "/tasks", edit = false): string {
  return `/tasks/${encodeURIComponent(id)}${edit ? "/edit" : ""}?returnTo=${encodeURIComponent(taskListReturn(returnTo))}`;
}
