import type { EventInput, EventStatus, EventType } from "../core/contracts";

export function readEventForm(form: FormData): EventInput {
  return {
    name: String(form.get("name") ?? ""),
    description: String(form.get("description") ?? ""),
    location: String(form.get("location") ?? ""),
    startsAt: String(form.get("startsAt") ?? ""),
    eventType: String(form.get("eventType") ?? "") as EventType,
    status: String(form.get("status") ?? "") as EventStatus,
    requiresStudentId: form.has("requiresStudentId"),
  };
}
