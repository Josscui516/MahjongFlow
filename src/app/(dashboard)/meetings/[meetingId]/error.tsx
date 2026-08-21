"use client";

import Link from "next/link";
import { useEffect } from "react";

import {
  PRIMARY_ROUTE_ACTION_CLASS,
  RouteErrorFeedback,
  SECONDARY_ROUTE_ACTION_CLASS,
} from "@/components/feedback";
import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";

export default function MeetingDetailError({
  error,
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  useEffect(() => {
    console.error("Meeting detail route failed", {
      digest: error.digest ?? "unavailable",
    });
  }, [error.digest]);

  return (
    <div className="space-y-6">
      <MeetingPageHeader
        description="Review the recorded committee-safe summary and update the meeting when needed."
        title="Meeting details"
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
        description="The meeting record could not be loaded. Try again, or return to meeting history and choose another record."
        note="No meeting changes were made."
        recoveryItems={[
          "Retry loading this meeting record",
          "Return to meeting history and choose another record",
        ]}
        title="Meeting details are unavailable"
      />
    </div>
  );
}
