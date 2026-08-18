import Link from "next/link";

import { MeetingStatePanel } from "@/features/meetings/editor/MeetingStatePanel";

export default function MeetingNotFound() {
  return (
    <MeetingStatePanel
      action={
        <Link className="font-semibold underline underline-offset-2" href="/meetings">
          Back to meetings
        </Link>
      }
      description="The requested meeting may have moved or no longer exists. No participant details are shown."
      state="system"
      title="Meeting not found"
    />
  );
}
