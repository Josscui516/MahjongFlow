"use client";

import { useEffect } from "react";

import {
  MEETING_HISTORY_DESCRIPTION,
  MeetingHistorySystemErrorView,
} from "@/features/meetings/history";

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
    <main
      aria-label={MEETING_HISTORY_DESCRIPTION}
      className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-10"
    >
      <MeetingHistorySystemErrorView
        action={
          <button
            className="rounded-lg border border-current px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
            onClick={retry}
            type="button"
          >
            Try again
          </button>
        }
      />
    </main>
  );
}
