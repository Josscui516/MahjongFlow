export type MeetingHistoryItem = Readonly<{
  id: string;
  startsAt: string;
  summary: string | null;
  title: string;
}>;

export type MeetingHistoryTimeFilter = "all" | "past" | "upcoming";
export type MeetingHistorySort = "newest" | "oldest";

export type MeetingHistoryCriteria = Readonly<{
  page: number;
  pageSize: number;
  search: string;
  sort: MeetingHistorySort;
  time: MeetingHistoryTimeFilter;
}>;

export type MeetingHistoryPageResult = Readonly<{
  items: readonly MeetingHistoryItem[];
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
}>;

export const MEETING_HISTORY_QUERY_ERROR =
  "MEETING_HISTORY_UNAVAILABLE" as const;

export type MeetingHistoryQueryResult =
  | Readonly<{
      result: MeetingHistoryPageResult;
      ok: true;
    }>
  | Readonly<{
      error: typeof MEETING_HISTORY_QUERY_ERROR;
      ok: false;
    }>;

export type MeetingHistoryQueryPort = (
  criteria: MeetingHistoryCriteria,
) => Promise<MeetingHistoryQueryResult>;

export type MeetingHistoryRole = "authorised" | "committee";

export type MeetingHistoryAccessResult =
  | Readonly<{
      context: Readonly<{
        canManageAccounts: boolean;
        displayName?: string;
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
