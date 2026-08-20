import { notFound, redirect } from "next/navigation";

import { MeetingEditorFlow } from "@/features/meetings/editor/MeetingEditorFlow";
import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import { MeetingRouteShell } from "@/features/meetings/editor/MeetingRouteShell";
import { MeetingStatePanel } from "@/features/meetings/editor/MeetingStatePanel";
import {
  listMeetingAttendeeOptions,
  readMeeting,
  readMeetingAgenda,
} from "@/features/meetings/editor/server";
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

  const meetingResult = await readMeeting(meetingId);

  if (!meetingResult.ok) {
    if (meetingResult.code === "NOT_FOUND") notFound();
    return (
      <MeetingRouteShell currentPath={`/meetings/${meetingId}`} role={context.role}>
        <MeetingStatePanel
          description={meetingResult.code === "PERMISSION_DENIED" ? "You do not have permission to view or edit this meeting." : "This meeting could not be loaded. Return to meeting history and try again."}
          state={meetingResult.code === "PERMISSION_DENIED" ? "permission" : "system"}
          title={meetingResult.code === "PERMISSION_DENIED" ? "Access required" : "Something went wrong"}
        />
      </MeetingRouteShell>
    );
  }

  const [agenda, attendeeResult] = await Promise.all([
    readMeetingAgenda(meetingId),
    listMeetingAttendeeOptions(),
  ]);

  if (!agenda || !attendeeResult.ok) {
    const permissionDenied = !attendeeResult.ok && attendeeResult.code === "PERMISSION_DENIED";
    return (
      <MeetingRouteShell currentPath={`/meetings/${meetingId}`} role={context.role}>
        <MeetingStatePanel
          description={permissionDenied ? "You do not have permission to view or edit this meeting." : "This meeting is unavailable. Return to meeting history and try again."}
          state={permissionDenied ? "permission" : "system"}
          title={permissionDenied ? "Access required" : "Meeting unavailable"}
        />
      </MeetingRouteShell>
    );
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
      <MeetingEditorFlow
        agenda={agenda}
        attendeeOptions={attendeeResult.options}
        initialRecord={meetingResult.record}
        mode="update"
      />
    </MeetingRouteShell>
  );
}
