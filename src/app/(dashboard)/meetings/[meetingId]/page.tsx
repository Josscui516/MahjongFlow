import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MeetingEditorFlow } from "@/features/meetings/editor/MeetingEditorFlow";
import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
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
import { RelatedTasksPanel } from "@/features/tasks/source-navigation/RelatedTasksPanel";
import { listRelatedTasks } from "@/features/tasks/source-navigation/service";
import { toAgendaSources } from "@/features/meetings/agenda/agenda";

export default async function MeetingDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ meetingId: string }>;
  searchParams?: Promise<{ created?: string }>;
}>) {
  const [{ meetingId }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ created?: string }>({}),
  ]);

  try {
    await requireBackendUser();
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
      <MeetingStatePanel
        description={meetingResult.code === "PERMISSION_DENIED" ? "You do not have permission to view or edit this meeting." : "This meeting could not be loaded. Return to meeting history and try again."}
        state={meetingResult.code === "PERMISSION_DENIED" ? "permission" : "system"}
        title={meetingResult.code === "PERMISSION_DENIED" ? "Access required" : "Something went wrong"}
      />
    );
  }

  const [agenda, attendeeResult, relatedTasksResult] = await Promise.all([
    readMeetingAgenda(meetingId),
    listMeetingAttendeeOptions(),
    listRelatedTasks(meetingId),
  ]);

  if (!agenda || !attendeeResult.ok) {
    const permissionDenied = !attendeeResult.ok && attendeeResult.code === "PERMISSION_DENIED";
    return (
      <MeetingStatePanel
        description={permissionDenied ? "You do not have permission to view or edit this meeting." : "This meeting is unavailable. Return to meeting history and try again."}
        state={permissionDenied ? "permission" : "system"}
        title={permissionDenied ? "Access required" : "Meeting unavailable"}
      />
    );
  }

  return (
    <>
      <Link className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href="/meetings">Back to meetings</Link>
      <MeetingPageHeader
        description="Review the meeting details and agenda, then turn follow-up actions into tasks."
        title="Meeting details"
      />
      <MeetingEditorFlow
        agenda={agenda}
        relatedTasks={relatedTasksResult}
        attendeeOptions={attendeeResult.options}
        initialRecord={meetingResult.record}
        justCreated={query.created === "1"}
        mode="update"
      />
      <div className="mt-6 max-w-4xl">
        <RelatedTasksPanel agendaItems={toAgendaSources(agenda)} result={relatedTasksResult} />
      </div>
    </>
  );
}
