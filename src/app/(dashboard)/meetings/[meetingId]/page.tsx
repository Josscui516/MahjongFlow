import { notFound, redirect } from "next/navigation";

import { getFictionalMeeting } from "@/features/meetings/editor/fixtures";
import { MeetingEditor } from "@/features/meetings/editor/MeetingEditor";
import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import { MeetingRouteShell } from "@/features/meetings/editor/MeetingRouteShell";
import { MeetingStatePanel } from "@/features/meetings/editor/MeetingStatePanel";
import {
  AuthorizationError,
  requireBackendUser,
} from "@/lib/auth/authorization";

export default async function MeetingDetailPage({
  params,
}: Readonly<{ params: Promise<{ meetingId: string }> }>) {
  const { meetingId } = await params;
  let context;

  try {
    context = await requireBackendUser();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.code === "UNAUTHENTICATED") {
        redirect(`/login?next=${encodeURIComponent(`/meetings/${meetingId}`)}`);
      }

      return (
        <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
          <div className="w-full max-w-xl">
            <MeetingStatePanel
              description="You do not have permission to view or edit this meeting."
              state="permission"
              title="Access required"
            />
          </div>
        </main>
      );
    }

    throw error;
  }

  const meeting = getFictionalMeeting(meetingId);

  if (!meeting) {
    notFound();
  }

  return (
    <MeetingRouteShell
      currentPath={`/meetings/${meetingId}`}
      role={context.role}
    >
      <MeetingPageHeader
        description="Review the recorded committee-safe summary and update the meeting when needed."
        title="Meeting details"
      />
      <MeetingEditor initialRecord={meeting} mode="update" />
    </MeetingRouteShell>
  );
}
