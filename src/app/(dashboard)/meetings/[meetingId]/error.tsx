"use client";

import Link from "next/link";
import { useEffect } from "react";

import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import { MeetingRouteErrorPanel } from "@/features/meetings/editor/MeetingStatePanel";

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
        description="The meeting record could not be loaded. Try again, or return to meeting history and choose another record."
        title="Meeting details are unavailable"
      />
    </div>
  );
}
