"use client";

import { MeetingStatePanel } from "@/features/meetings/editor/MeetingStatePanel";

export default function NewMeetingError({ retry }: Readonly<{ retry: () => void }>) {
  return (
    <MeetingStatePanel
      action={
        <button
          className="rounded-xl border border-current px-4 py-2 text-sm font-semibold"
          onClick={retry}
          type="button"
        >
          Try again
        </button>
      }
      description="Try again. If the problem continues, contact the committee administrator."
      state="system"
      title="Something went wrong"
    />
  );
}
