import { EVENT_STATUSES, type EventStatus } from "../core/contracts";
import { sydneyInstant } from "../core/validation";

export const EVENT_PAGE_SIZE = 20;
export type EventFilters = Readonly<{ q: string; status: EventStatus | ""; from: string; to: string; page: number }>;
export type EventSearchParams = Readonly<Record<string, string | string[] | undefined>>;
const day = (value: string) => value >= "0100-01-01" && value <= "9999-12-30" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value && sydneyInstant(`${value}T00:00`) !== null;
export function readEventFilters(params: EventSearchParams): { filters: EventFilters; error?: string } {
  const text = (key: string) => typeof params[key] === "string" ? params[key].trim() : "";
  const filters: EventFilters = { q: text("q"), status: text("status") as EventFilters["status"], from: text("from"), to: text("to"), page: text("page") ? Number(text("page")) : 1 };
  if (["q", "status", "from", "to", "page"].some(key => Array.isArray(params[key]))) return { filters, error: "Use one value per filter." };
  if (filters.q.length > 100 || /[\u0000-\u001f]/.test(filters.q)) return { filters, error: "Use a search of 100 characters or fewer without control characters." };
  if (filters.status && !EVENT_STATUSES.includes(filters.status)) return { filters, error: "Choose a valid event status." };
  if ((filters.from && !day(filters.from)) || (filters.to && !day(filters.to))) return { filters, error: "Enter valid start and end dates." };
  if (filters.from && filters.to && filters.from > filters.to) return { filters, error: "The end date must be on or after the start date." };
  if (!Number.isSafeInteger(filters.page) || filters.page < 1 || filters.page > 10000) return { filters, error: "Choose a valid results page." };
  return { filters };
}
export function eventDateBounds(filters: EventFilters) {
  const nextDay = filters.to ? new Date(Date.parse(`${filters.to}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) : "";
  return { from: filters.from ? sydneyInstant(`${filters.from}T00:00`)?.toISOString() : undefined, before: nextDay ? sydneyInstant(`${nextDay}T00:00`)?.toISOString() : undefined };
}
export function eventListHref(filters: EventFilters, page = filters.page) {
  const query = new URLSearchParams();
  for (const key of ["q", "status", "from", "to"] as const) if (filters[key]) query.set(key, filters[key]);
  if (page > 1) query.set("page", String(page));
  return `/events${query.size ? `?${query}` : ""}`;
}
