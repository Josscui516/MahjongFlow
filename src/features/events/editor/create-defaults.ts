import type { EventInput } from "../core/contracts";

export function localDateTime(iso?: string) {
  if (!iso) return "";
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(iso)) return iso.slice(0, 16);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { day: "2-digit", hour: "2-digit", hourCycle: "h23", minute: "2-digit", month: "2-digit", timeZone: "Australia/Sydney", year: "numeric" }).formatToParts(new Date(iso)).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function eventCreateDefaults(now: Date): EventInput {
  return { name: "", description: "", location: "", startsAt: localDateTime(now.toISOString()), eventType: "weekly_session", status: "scheduled", requiresStudentId: false };
}
