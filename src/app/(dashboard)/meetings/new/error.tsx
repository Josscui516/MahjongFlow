"use client";

import Link from "next/link";
import { useEffect } from "react";

import {
  PRIMARY_ROUTE_ACTION_CLASS,
  RouteErrorFeedback,
  SECONDARY_ROUTE_ACTION_CLASS,
} from "@/components/feedback";
import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";

export default function NewMeetingError({
  error,
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  useEffect(() => {
    console.error("New meeting route failed", {
      digest: error.digest ?? "unavailable",
    });
  }, [error.digest]);

  return (
    <div className="space-y-6">
      <MeetingPageHeader
        description="Record committee-safe meeting details and participants. Add ordered agenda items after the meeting is created."
        title="Create meeting"
      />
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
            <Link
              className={SECONDARY_ROUTE_ACTION_CLASS}
              href="/meetings"
            >
              Back to meetings
            </Link>
          </>
        }
        description="The meeting editor could not be prepared. Try again, or return to meeting history without creating a record."
        note="No meeting was created."
        recoveryItems={[
          "Retry loading committee profiles and form controls",
          "Return to meetings without creating a record",
        ]}
        title="The meeting editor is unavailable"
      />
    </div>
  );
}
