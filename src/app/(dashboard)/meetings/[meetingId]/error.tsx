"use client";

import Link from "next/link";

import { MeetingStatePanel } from "@/features/meetings/editor/MeetingStatePanel";

export default function MeetingDetailError({ retry }: Readonly<{ retry: () => void }>) {
  return (
    <MeetingStatePanel
      action={
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-xl border border-current px-4 py-2 text-sm font-semibold"
            onClick={retry}
            type="button"
          >
            Try again
          </button>
          <Link className="rounded-xl px-4 py-2 text-sm font-semibold underline" href="/meetings">
            Back to meetings
          </Link>
        </div>
      }
      description="Try again. If the problem continues, contact the committee administrator."
      state="system"
      title="Something went wrong"
    />
  );
}
