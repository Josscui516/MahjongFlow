import {
  MEETING_HISTORY_QUERY_ERROR,
  type MeetingHistoryCriteria,
  type MeetingHistoryQueryPort,
} from "./contracts";
import { projectMeetingHistoryRows } from "./projection";

export type MeetingHistoryRowLoader = (
  criteria: MeetingHistoryCriteria,
) => Promise<
  Readonly<{
    count: number | null;
    data: unknown;
    error: unknown | null;
  }>
>;

/**
 * Adapts an injected, server-owned row loader to the frozen history contract.
 * Provider errors are deliberately reduced to one safe application error.
 */
export function createMeetingHistoryQuery(
  loadRows: MeetingHistoryRowLoader,
): MeetingHistoryQueryPort {
  return async (criteria) => {
    try {
      const { count, data, error } = await loadRows(criteria);

      if (error !== null || count === null || count < 0) {
        return { error: MEETING_HISTORY_QUERY_ERROR, ok: false };
      }

      return {
        ok: true,
        result: {
          items: projectMeetingHistoryRows(data, criteria.sort),
          page: criteria.page,
          pageCount: Math.max(1, Math.ceil(count / criteria.pageSize)),
          pageSize: criteria.pageSize,
          totalCount: count,
        },
      };
    } catch {
      return { error: MEETING_HISTORY_QUERY_ERROR, ok: false };
    }
  };
}
