import "server-only";

import { listEvents } from "@/features/events/core/service";

export type TaskEventOption = Readonly<{ id: string; label: string }>;
export type TaskEventOptionsResult = Readonly<{ items: readonly TaskEventOption[]; ok: true }> | Readonly<{ code: "PERMISSION_DENIED" | "SYSTEM_ERROR"; ok: false }>;

export async function listTaskEventOptions(list = listEvents): Promise<TaskEventOptionsResult> {
  const result = await list();
  return result.ok ? { items: result.items.map(({ id, name, startsAt }) => ({ id, label: `${name} — ${new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(startsAt))}` })), ok: true } : result;
}
