import { redirect } from "next/navigation";

import {
  MeetingHistoryPageView,
  MeetingHistoryPermissionDeniedView,
  MeetingHistorySystemErrorView,
  resolveMeetingHistoryScreen,
} from "@/features/meetings/history";
import {
  buildMeetingHistoryHref,
  parseMeetingHistorySearchParams,
  type MeetingHistorySearchParams,
} from "@/features/meetings/history/search-params";
import {
  getMeetingHistoryAccess,
  queryMeetingHistory,
} from "@/features/meetings/history/server";

export default async function MeetingsPage({
  searchParams = Promise.resolve({}),
}: Readonly<{
  searchParams?: Promise<MeetingHistorySearchParams>;
}>) {
  const rawSearchParams = await searchParams;
  const criteria = parseMeetingHistorySearchParams(rawSearchParams);
  const state = await resolveMeetingHistoryScreen({
    criteria,
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
    case "ready": {
      if (criteria.page > state.result.pageCount) {
        redirect(buildMeetingHistoryHref(criteria, state.result.pageCount));
      }

      return (
        <MeetingHistoryPageView
          criteria={criteria}
          meetingDeleted={rawSearchParams.deleted === "1"}
          result={state.result}
        />
      );
    }
  }
}
