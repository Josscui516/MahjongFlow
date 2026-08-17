import type {
  MeetingHistoryAccessPort,
  MeetingHistoryItem,
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
      items: readonly MeetingHistoryItem[];
      role: MeetingHistoryRole;
      status: "ready";
    }>;

type MeetingHistoryScreenDependencies = Readonly<{
  getAccess: MeetingHistoryAccessPort;
  queryHistory: MeetingHistoryQueryPort;
}>;

/**
 * Keeps authorisation ahead of every history query. The route integration can
 * adapt the existing auth guard to `getAccess` without duplicating auth logic.
 */
export async function resolveMeetingHistoryScreen({
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
    const history = await queryHistory();

    if (!history.ok) {
      return { role: access.context.role, status: "system-error" };
    }

    return {
      items: history.items,
      role: access.context.role,
      status: "ready",
    };
  } catch {
    return { role: access.context.role, status: "system-error" };
  }
}
