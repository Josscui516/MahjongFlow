import { EVENT_STATUSES, EVENT_TYPES, type EventInput, type EventValidationError } from "./contracts";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
export const isEventId = (value: string) => UUID.test(value);
function sydneyInstant(value: string): Date | null {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return null;
    const day = value.slice(0, 10); const parsedDay = new Date(`${day}T00:00:00Z`);
    if (!Number.isFinite(parsedDay.getTime()) || parsedDay.toISOString().slice(0, 10) !== day) return null;
    const explicit = new Date(value); return Number.isFinite(explicit.getTime()) ? explicit : null;
  }
  const fields = match.slice(1).map(Number); const [year, month, day, hour, minute] = fields;
  const target = Date.UTC(year, month - 1, day, hour, minute);
  if (new Date(target).toISOString().slice(0, 16) !== `${value}:00.000Z`.slice(0, 16)) return null;
  const formatter = new Intl.DateTimeFormat("en-CA", { day: "2-digit", hour: "2-digit", hourCycle: "h23", minute: "2-digit", month: "2-digit", timeZone: "Australia/Sydney", year: "numeric" });
  let candidate = target;
  for (let index = 0; index < 2; index += 1) { const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value])); const shown = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute)); candidate -= shown - target; }
  const result = new Date(candidate); const parts = Object.fromEntries(formatter.formatToParts(result).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` === value ? result : null;
}
export function validateEventInput(input: EventInput) {
  if (!input || typeof input !== "object" || [input.name, input.location, input.description, input.startsAt].some((field) => typeof field !== "string") || typeof input.requiresStudentId !== "boolean") {
    return { ok: false as const, errors: [{ field: "name" as const, message: "Provide valid event fields and a boolean student ID requirement." }] };
  }
  const errors: EventValidationError[] = []; const name = input.name.trim(); const location = input.location.trim(); const description = input.description.trim();
  if (!name || name.length > 200) errors.push({ field: "name", message: "Name must contain 1 to 200 characters." });
  if (!location || location.length > 300) errors.push({ field: "location", message: "Location must contain 1 to 300 characters." });
  if (description.length > 10_000) errors.push({ field: "description", message: "Description cannot exceed 10000 characters." });
  if (!EVENT_TYPES.includes(input.eventType)) errors.push({ field: "eventType", message: "Select a valid event type." });
  if (!EVENT_STATUSES.includes(input.status)) errors.push({ field: "status", message: "Select a valid event status." });
  const instant = sydneyInstant(input.startsAt); if (!instant) errors.push({ field: "startsAt", message: "Enter a valid event date and time." });
  return errors.length || !instant ? { errors, ok: false as const } : { ok: true as const, value: { ...input, description, location, name, startsAt: instant.toISOString() } };
}
