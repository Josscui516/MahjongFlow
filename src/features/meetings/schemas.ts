export type MeetingInput = Readonly<{ attendeeIds: readonly string[]; startsAt: string; summary: string; title: string }>;
export type MeetingField = "attendeeIds" | "startsAt" | "summary" | "title";
export type MeetingValidationError = Readonly<{ field: MeetingField; message: string }>;
export type NormalisedMeetingInput = MeetingInput;
export type MeetingValidationResult =
  | Readonly<{ ok: true; value: NormalisedMeetingInput }>
  | Readonly<{ errors: readonly MeetingValidationError[]; ok: false }>;

export const MEETING_TITLE_MAX_LENGTH = 200;
export const MEETING_SUMMARY_MAX_LENGTH = 10_000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
const OFFSET_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-](\d{2}):(\d{2}))$/i;
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
  return utcTimestamp(
    p.year,
    p.month,
    p.day,
    p.hour === 24 ? 0 : p.hour,
    p.minute,
    p.second,
    date.getUTCMilliseconds(),
  ) - date.getTime();
}

function utcTimestamp(year: number, month: number, day: number, hour: number, minute: number, second: number, millisecond: number) {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);
  return date.getTime();
}

function isValidWallClock(year: number, month: number, day: number, hour: number, minute: number, second: number, millisecond: number) {
  const date = new Date(utcTimestamp(year, month, day, hour, minute, second, millisecond));
  return year >= 1
    && date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && date.getUTCHours() === hour
    && date.getUTCMinutes() === minute
    && date.getUTCSeconds() === second
    && date.getUTCMilliseconds() === millisecond;
}

function parseSydneyLocal(value: string): string | null {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) return null;
  const [, y, m, d, h, min, sec = "00", fraction = "0"] = match;
  const requested = {
    year: +y,
    month: +m,
    day: +d,
    hour: +h,
    minute: +min,
    second: +sec,
    millisecond: +fraction.padEnd(3, "0"),
  };
  const requestedValues = [
    requested.year,
    requested.month,
    requested.day,
    requested.hour,
    requested.minute,
    requested.second,
    requested.millisecond,
  ] as const;
  if (!isValidWallClock(...requestedValues)) return null;

  const wallClock = utcTimestamp(...requestedValues);
  const possibleOffsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 6) {
    possibleOffsets.add(sydneyOffset(new Date(wallClock + hours * 60 * 60 * 1_000)));
  }
  const candidates = [...possibleOffsets]
    .map((offset) => new Date(wallClock - offset))
    .filter((candidate) => {
      const actual = sydneyParts(candidate);
      return actual.year === requested.year
        && actual.month === requested.month
        && actual.day === requested.day
        && actual.hour === requested.hour
        && actual.minute === requested.minute
        && actual.second === requested.second
        && candidate.getUTCMilliseconds() === requested.millisecond;
    })
    .sort((left, right) => left.getTime() - right.getTime());

  // During the repeated DST hour, consistently select the first occurrence.
  return candidates[0]?.toISOString() ?? null;
}

function parseOffsetDateTime(value: string): string | null {
  const match = OFFSET_DATE_TIME.exec(value);
  if (!match) return null;
  const [, y, m, d, h, min, sec = "00", fraction = "0", , offsetHour, offsetMinute] = match;
  const requested = [+y, +m, +d, +h, +min, +sec, +fraction.padEnd(3, "0")] as const;
  if (!isValidWallClock(...requested)) return null;
  if (offsetHour && (+offsetHour > 23 || +(offsetMinute ?? "0") > 59)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normaliseStartsAt(value: string): string | null {
  const trimmed = value.trim();
  return OFFSET_DATE_TIME.test(trimmed) ? parseOffsetDateTime(trimmed) : parseSydneyLocal(trimmed);
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isMeetingId(value: string): boolean {
  return isUuid(value);
}

export function validateMeetingInput(input: MeetingInput): MeetingValidationResult {
  const errors: MeetingValidationError[] = [];
  const title = input.title.trim();
  const summary = input.summary.trim();
  const startsAt = normaliseStartsAt(input.startsAt);
  const attendeeIds = input.attendeeIds.map((id) => id.trim());
  const uniqueAttendeeIds = [...new Set(attendeeIds)];
  if (!title || title.length > MEETING_TITLE_MAX_LENGTH) errors.push({ field: "title", message: "Enter a meeting title of no more than 200 characters." });
  if (!startsAt) errors.push({ field: "startsAt", message: "Choose a valid Sydney meeting date and time." });
  if (!attendeeIds.length || uniqueAttendeeIds.length !== attendeeIds.length || attendeeIds.some((id) => !isUuid(id))) {
    errors.push({ field: "attendeeIds", message: "Select at least one unique committee attendee." });
  }
  if (!summary || summary.length > MEETING_SUMMARY_MAX_LENGTH) errors.push({ field: "summary", message: "Enter a meeting summary of no more than 10,000 characters." });
  if (errors.length || !startsAt) return { errors, ok: false };
  return { ok: true, value: { attendeeIds: uniqueAttendeeIds, startsAt, summary, title } };
}
