import {
  MEETING_HISTORY_QUERY_ERROR,
  type MeetingHistoryQueryPort,
} from "./contracts";
import { projectMeetingHistoryRows } from "./projection";

export type MeetingHistoryRowLoader = () => Promise<
  Readonly<{
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
  return async () => {
    try {
      const { data, error } = await loadRows();

      if (error !== null) {
        return { error: MEETING_HISTORY_QUERY_ERROR, ok: false };
      }

      return { items: projectMeetingHistoryRows(data), ok: true };
    } catch {
      return { error: MEETING_HISTORY_QUERY_ERROR, ok: false };
    }
  };
}
