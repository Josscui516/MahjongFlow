import Link from "next/link";

import {
  PermissionDeniedFeedback,
  SystemErrorFeedback,
} from "@/components/feedback";
import { PageFrame } from "@/components/layout";

import type { MeetingHistoryItem } from "./contracts";
import { MeetingHistoryList } from "./MeetingHistoryList";

export const MEETING_HISTORY_DESCRIPTION =
  "Review previous committee meetings and reopen their recorded details.";

export function MeetingHistoryPageView({
  items,
}: Readonly<{ items: readonly MeetingHistoryItem[] }>) {
  return (
    <PageFrame
      description={MEETING_HISTORY_DESCRIPTION}
      title="Meeting history"
    >
      <MeetingHistoryList items={items} />
    </PageFrame>
  );
}

export function MeetingHistoryPermissionDeniedView() {
  return (
    <PageFrame
      description={MEETING_HISTORY_DESCRIPTION}
      feedbackSlot={
        <PermissionDeniedFeedback
          backAction={
            <Link
              className="font-semibold underline underline-offset-4"
              href="/backoffice"
            >
              Return to the back office
            </Link>
          }
        />
      }
      title="Meeting history"
    >
      <p className="text-sm text-slate-600">
        No meeting information has been displayed.
      </p>
    </PageFrame>
  );
}

export function MeetingHistorySystemErrorView({
  action,
}: Readonly<{ action?: React.ReactNode }>) {
  return (
    <PageFrame
      description={MEETING_HISTORY_DESCRIPTION}
      feedbackSlot={<SystemErrorFeedback action={action} />}
      title="Meeting history"
    >
      <p className="text-sm text-slate-600">
        No meeting information has been displayed.
      </p>
    </PageFrame>
  );
}
