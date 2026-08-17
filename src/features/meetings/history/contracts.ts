export type MeetingHistoryItem = Readonly<{
  id: string;
  startsAt: string;
  summary: string | null;
  title: string;
}>;

export const MEETING_HISTORY_QUERY_ERROR =
  "MEETING_HISTORY_UNAVAILABLE" as const;

export type MeetingHistoryQueryResult =
  | Readonly<{
      items: readonly MeetingHistoryItem[];
      ok: true;
    }>
  | Readonly<{
      error: typeof MEETING_HISTORY_QUERY_ERROR;
      ok: false;
    }>;

export type MeetingHistoryQueryPort = () => Promise<MeetingHistoryQueryResult>;

export type MeetingHistoryRole = "authorised" | "committee";

export type MeetingHistoryAccessResult =
  | Readonly<{
      context: Readonly<{
        role: MeetingHistoryRole;
        userId: string;
      }>;
      ok: true;
    }>
  | Readonly<{
      ok: false;
      reason: "forbidden" | "system-error" | "unauthenticated";
    }>;

export type MeetingHistoryAccessPort =
  () => Promise<MeetingHistoryAccessResult>;
