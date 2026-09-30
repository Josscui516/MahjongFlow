import type { CheckInWindowError, CheckInWindowInput } from "./contracts";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const formatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Australia/Sydney",
  year: "numeric",
});

export function isEventId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function parts(date: Date) {
  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  ) as Record<string, number>;
}

function parseSydneyLocal(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = LOCAL_DATE_TIME.exec(value.trim());
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const wanted = { year: +year, month: +month, day: +day, hour: +hour, minute: +minute };
  const wallClock = Date.UTC(wanted.year, wanted.month - 1, wanted.day, wanted.hour, wanted.minute);
  const basic = new Date(wallClock);
  if (
    basic.getUTCFullYear() !== wanted.year ||
    basic.getUTCMonth() !== wanted.month - 1 ||
    basic.getUTCDate() !== wanted.day ||
    basic.getUTCHours() !== wanted.hour ||
    basic.getUTCMinutes() !== wanted.minute
  ) return null;

  const candidates: Date[] = [];
  for (let offsetMinutes = 600; offsetMinutes <= 660; offsetMinutes += 60) {
    const candidate = new Date(wallClock - offsetMinutes * 60_000);
    const actual = parts(candidate);
    if (Object.keys(wanted).every((key) => actual[key] === wanted[key as keyof typeof wanted])) {
      candidates.push(candidate);
    }
  }
  return candidates.sort((left, right) => left.getTime() - right.getTime())[0]?.toISOString() ?? null;
}

export function validateCheckInWindow(input: unknown):
  | Readonly<{ errors: readonly CheckInWindowError[]; ok: false }>
  | Readonly<{ ok: true; value: Readonly<{ closesAt: string; opensAt: string }> }> {
  // Server Action arguments are untrusted at runtime, regardless of the form's
  // TypeScript contract. Invalid shapes must receive the same safe field errors.
  const fields = input !== null && typeof input === "object" && !Array.isArray(input)
    ? input as Partial<Record<keyof CheckInWindowInput, unknown>>
    : {};
  const opensAt = parseSydneyLocal(fields.opensAt);
  const closesAt = parseSydneyLocal(fields.closesAt);
  const errors: CheckInWindowError[] = [];
  if (!opensAt) errors.push({ field: "opensAt", message: "Choose a valid Sydney opening date and time." });
  if (!closesAt) errors.push({ field: "closesAt", message: "Choose a valid Sydney closing date and time." });
  if (opensAt && closesAt && opensAt >= closesAt) {
    errors.push({ field: "closesAt", message: "Closing time must be after opening time." });
  }
  return errors.length || !opensAt || !closesAt
    ? { errors, ok: false }
    : { ok: true, value: { closesAt, opensAt } };
}
