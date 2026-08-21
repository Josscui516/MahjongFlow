"use client";

import Link from "next/link";
import { useEffect } from "react";

import {
  PRIMARY_ROUTE_ACTION_CLASS,
  RouteErrorFeedback,
  SECONDARY_ROUTE_ACTION_CLASS,
} from "@/components/feedback";
import { PageFrame } from "@/components/layout";
import { MEETING_HISTORY_DESCRIPTION } from "@/features/meetings/history";

export default function MeetingHistoryError({
  error,
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  useEffect(() => {
    console.error("Meeting history route failed", {
      digest: error.digest ?? "unavailable",
    });
  }, [error.digest]);

  return (
    <PageFrame
      description={MEETING_HISTORY_DESCRIPTION}
      title="Meetings"
    >
      <RouteErrorFeedback
        actions={
          <>
            <button
              className={PRIMARY_ROUTE_ACTION_CLASS}
              onClick={retry}
              type="button"
            >
              Try again
            </button>
            <Link className={SECONDARY_ROUTE_ACTION_CLASS} href="/backoffice">
              Return to back office
            </Link>
          </>
        }
        description="Try reconnecting to the meeting history. If the problem continues, return to the back office and come back later."
        note="Your meeting records are unchanged."
        pattern="interrupted-timeline"
        recoveryItems={[
          "Retry with the same search and filters",
          "Return to the back office if the service remains unavailable",
        ]}
        title="Meeting records could not be loaded"
      />
    </PageFrame>
  );
}
