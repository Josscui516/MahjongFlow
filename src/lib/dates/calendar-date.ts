const ISO_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MILLISECONDS_PER_DAY = 86_400_000;

export const SYDNEY_TIME_ZONE = "Australia/Sydney";

export type CalendarDate = Readonly<{
  isoDate: string;
  ordinal: number;
}>;

export type CalendarDateInvalidReason =
  | "INVALID_DATE"
  | "INVALID_INSTANT"
  | "UNSUPPORTED_TIME_ZONE";

export type CalendarDateResult =
  | Readonly<{ ok: true; value: CalendarDate }>
  | Readonly<{ ok: false; reason: CalendarDateInvalidReason; value: "invalid" }>;

const invalid = (reason: CalendarDateInvalidReason): CalendarDateResult => ({
  ok: false,
  reason,
  value: "invalid",
});

/**
 * Parses a date-only ISO value without allowing JavaScript Date rollover.
 * The ordinal is used only for civil-day comparisons, never elapsed-time math.
 */
export function parseIsoCalendarDate(value: string): CalendarDateResult {
  const match = ISO_CALENDAR_DATE.exec(value);

  if (!match) {
    return invalid("INVALID_DATE");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1) {
    return invalid("INVALID_DATE");
  }

  // setUTCFullYear avoids Date.UTC treating years 0-99 as 1900-1999.
  const calendarDate = new Date(0);
  calendarDate.setUTCHours(0, 0, 0, 0);
  calendarDate.setUTCFullYear(year, month - 1, day);

  if (
    calendarDate.getUTCFullYear() !== year
    || calendarDate.getUTCMonth() !== month - 1
    || calendarDate.getUTCDate() !== day
  ) {
    return invalid("INVALID_DATE");
  }

  return {
    ok: true,
    value: {
      isoDate: value,
      ordinal: Math.floor(calendarDate.getTime() / MILLISECONDS_PER_DAY),
    },
  };
}

/** Returns the ISO calendar date containing an instant in the requested zone. */
export function calendarDateAt(instant: Date, timeZone: string): CalendarDateResult {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) {
    return invalid("INVALID_INSTANT");
  }

  if (typeof timeZone !== "string" || timeZone.length === 0) {
    return invalid("UNSUPPORTED_TIME_ZONE");
  }

  let formatter: Intl.DateTimeFormat;

  try {
    formatter = new Intl.DateTimeFormat("en-AU", {
      calendar: "iso8601",
      day: "2-digit",
      month: "2-digit",
      numberingSystem: "latn",
      timeZone,
      year: "numeric",
    });
  } catch {
    return invalid("UNSUPPORTED_TIME_ZONE");
  }

  let parts: Intl.DateTimeFormatPart[];

  try {
    parts = formatter.formatToParts(instant);
  } catch {
    return invalid("INVALID_INSTANT");
  }

  const part = (type: Intl.DateTimeFormatPartTypes): string | undefined =>
    parts.find((candidate) => candidate.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");

  if (!year || !month || !day) {
    return invalid("INVALID_INSTANT");
  }

  return parseIsoCalendarDate(
    `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
  );
}
