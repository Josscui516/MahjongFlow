export type MeetingInput = Readonly<{ attendeeIds: readonly string[]; startsAt: string; summary: string; title: string }>;
export type MeetingField = "attendeeIds" | "startsAt" | "summary" | "title";
export type MeetingValidationError = Readonly<{ field: MeetingField; message: string }>;
export type NormalisedMeetingInput = MeetingInput;
export type MeetingValidationResult =
  | Readonly<{ ok: true; value: NormalisedMeetingInput }>
  | Readonly<{ errors: readonly MeetingValidationError[]; ok: false }>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const OFFSET_DATE_TIME = /(?:Z|[+-]\d{2}:\d{2})$/i;
const sydneyFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit",
  month: "2-digit", second: "2-digit", timeZone: "Australia/Sydney", year: "numeric",
});

function sydneyParts(date: Date) {
  return Object.fromEntries(sydneyFormatter.formatToParts(date)
    .filter(({ type }) => type !== "literal")
    .map(({ type, value }) => [type, Number(value)])) as Record<string, number>;
}

function sydneyOffset(date: Date) {
  const p = sydneyParts(date);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second) - date.getTime();
}

function parseSydneyLocal(value: string): string | null {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) return null;
  const [, y, m, d, h, min, sec = "00"] = match;
  const requested = { year: +y, month: +m, day: +d, hour: +h, minute: +min, second: +sec };
  const wallClock = Date.UTC(requested.year, requested.month - 1, requested.day, requested.hour, requested.minute, requested.second);
  let candidate = new Date(wallClock);
  for (let attempt = 0; attempt < 2; attempt += 1) candidate = new Date(wallClock - sydneyOffset(candidate));
  const actual = sydneyParts(candidate);
  return Object.entries(requested).every(([key, expected]) => actual[key] === expected) ? candidate.toISOString() : null;
}

function normaliseStartsAt(value: string): string | null {
  const trimmed = value.trim();
  if (!OFFSET_DATE_TIME.test(trimmed)) return parseSydneyLocal(trimmed);
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function validateMeetingInput(input: MeetingInput): MeetingValidationResult {
  const errors: MeetingValidationError[] = [];
  const title = input.title.trim();
  const summary = input.summary.trim();
  const startsAt = normaliseStartsAt(input.startsAt);
  const attendeeIds = input.attendeeIds.map((id) => id.trim());
  const uniqueAttendeeIds = [...new Set(attendeeIds)];
  if (!title || title.length > 200) errors.push({ field: "title", message: "Enter a meeting title of no more than 200 characters." });
  if (!startsAt) errors.push({ field: "startsAt", message: "Choose a valid Sydney meeting date and time." });
  if (!attendeeIds.length || uniqueAttendeeIds.length !== attendeeIds.length || attendeeIds.some((id) => !UUID_PATTERN.test(id))) {
    errors.push({ field: "attendeeIds", message: "Select at least one unique committee attendee." });
  }
  if (!summary || summary.length > 10_000) errors.push({ field: "summary", message: "Enter a meeting summary of no more than 10,000 characters." });
  if (errors.length || !startsAt) return { errors, ok: false };
  return { ok: true, value: { attendeeIds: uniqueAttendeeIds, startsAt, summary, title } };
}
