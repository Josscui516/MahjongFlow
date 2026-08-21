import type {
  MeetingHistoryAccessPort,
  MeetingHistoryCriteria,
  MeetingHistoryPageResult,
  MeetingHistoryQueryPort,
  MeetingHistoryRole,
} from "./contracts";

export type MeetingHistoryScreenState =
  | Readonly<{
      status: "permission-denied" | "unauthenticated";
    }>
  | Readonly<{
      role?: MeetingHistoryRole;
      status: "system-error";
    }>
  | Readonly<{
      result: MeetingHistoryPageResult;
      role: MeetingHistoryRole;
      status: "ready";
    }>;

type MeetingHistoryScreenDependencies = Readonly<{
  criteria: MeetingHistoryCriteria;
  getAccess: MeetingHistoryAccessPort;
  queryHistory: MeetingHistoryQueryPort;
}>;

/**
 * Keeps authorisation ahead of every history query. The route integration can
 * adapt the existing auth guard to `getAccess` without duplicating auth logic.
 */
export async function resolveMeetingHistoryScreen({
  criteria,
  getAccess,
  queryHistory,
}: MeetingHistoryScreenDependencies): Promise<MeetingHistoryScreenState> {
  let access;

  try {
    access = await getAccess();
  } catch {
    return { status: "system-error" };
  }

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    if (access.reason === "forbidden") {
      return { status: "permission-denied" };
    }

    return { status: "system-error" };
  }

  try {
    const history = await queryHistory(criteria);

    if (!history.ok) {
      return { role: access.context.role, status: "system-error" };
    }

    return {
      result: history.result,
      role: access.context.role,
      status: "ready",
    };
  } catch {
    return { role: access.context.role, status: "system-error" };
  }
}
