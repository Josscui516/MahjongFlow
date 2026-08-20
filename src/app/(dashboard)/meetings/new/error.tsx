"use client";

import Link from "next/link";
import { useEffect } from "react";

import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import { MeetingRouteErrorPanel } from "@/features/meetings/editor/MeetingStatePanel";

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
      <MeetingRouteErrorPanel
        action={
          <>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              onClick={retry}
              type="button"
            >
              Try again
            </button>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              href="/meetings"
            >
              Back to meetings
            </Link>
          </>
        }
        description="The meeting editor could not be prepared. Try again, or return to meeting history without creating a record."
        title="The meeting editor is unavailable"
      />
    </div>
  );
}
