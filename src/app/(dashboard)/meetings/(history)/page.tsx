import { redirect } from "next/navigation";

import {
  MeetingHistoryPageView,
  MeetingHistoryPermissionDeniedView,
  MeetingHistorySystemErrorView,
  resolveMeetingHistoryScreen,
} from "@/features/meetings/history";
import {
  getMeetingHistoryAccess,
  queryMeetingHistory,
} from "@/features/meetings/history/server";

export default async function MeetingsPage() {
  const state = await resolveMeetingHistoryScreen({
    getAccess: getMeetingHistoryAccess,
    queryHistory: queryMeetingHistory,
  });

  switch (state.status) {
    case "unauthenticated":
      redirect("/login?next=%2Fmeetings");
    case "permission-denied":
      return <MeetingHistoryPermissionDeniedView />;
    case "system-error":
      return <MeetingHistorySystemErrorView />;
    case "ready":
      return <MeetingHistoryPageView items={state.items} />;
  }
}
