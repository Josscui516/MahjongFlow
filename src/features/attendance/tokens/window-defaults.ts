import type { CheckInTokenStatus } from "./contracts";

export function localDateTime(value: string | null) {
  if (!value) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      day: "2-digit", hour: "2-digit", hourCycle: "h23", minute: "2-digit",
      month: "2-digit", timeZone: "Australia/Sydney", year: "numeric",
    }).formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Saved settings take precedence; new windows span two elapsed hours from the event start. */
export function initialWindowInput(status: CheckInTokenStatus, eventStartsAt: string) {
  return {
    opensAt: localDateTime(status.opensAt ?? eventStartsAt),
    closesAt: localDateTime(status.closesAt ?? new Date(new Date(eventStartsAt).getTime() + 2 * 60 * 60 * 1000).toISOString()),
  };
}
