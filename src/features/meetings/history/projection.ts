import type { MeetingHistoryItem } from "./contracts";

type MeetingHistoryRow = Readonly<{
  id: string;
  starts_at: string;
  summary: string | null;
  title: string;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidTimestamp(value: string) {
  return Number.isFinite(Date.parse(value));
}

function parseMeetingHistoryRow(value: unknown): MeetingHistoryRow {
  if (!isRecord(value)) {
    throw new TypeError("Invalid meeting history row");
  }

  const { id, starts_at: startsAt, summary, title } = value;

  if (
    typeof id !== "string" ||
    id.length === 0 ||
    typeof title !== "string" ||
    title.trim().length === 0 ||
    typeof startsAt !== "string" ||
    !isValidTimestamp(startsAt) ||
    (summary !== null && typeof summary !== "string")
  ) {
    throw new TypeError("Invalid meeting history row");
  }

  return { id, starts_at: startsAt, summary, title };
}

export function compareMeetingHistoryItems(
  left: MeetingHistoryItem,
  right: MeetingHistoryItem,
) {
  const timeDifference = Date.parse(right.startsAt) - Date.parse(left.startsAt);

  if (timeDifference !== 0) {
    return timeDifference;
  }

  if (left.id < right.id) {
    return -1;
  }

  if (left.id > right.id) {
    return 1;
  }

  return 0;
}

export function sortMeetingHistoryItems(
  items: readonly MeetingHistoryItem[],
): readonly MeetingHistoryItem[] {
  return [...items].sort(compareMeetingHistoryItems);
}

export function projectMeetingHistoryRows(
  value: unknown,
): readonly MeetingHistoryItem[] {
  if (!Array.isArray(value)) {
    throw new TypeError("Invalid meeting history response");
  }

  const items = value.map((candidate) => {
    const row = parseMeetingHistoryRow(candidate);

    return {
      id: row.id,
      startsAt: row.starts_at,
      summary: row.summary,
      title: row.title,
    } satisfies MeetingHistoryItem;
  });

  return sortMeetingHistoryItems(items);
}
