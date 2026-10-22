import { meetingCreateDefaults } from "@/features/meetings/editor/create-defaults";
import { redirect } from "next/navigation";

import { MeetingEditorFlow } from "@/features/meetings/editor/MeetingEditorFlow";
import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import { MeetingStatePanel } from "@/features/meetings/editor/MeetingStatePanel";
import { listMeetingAttendeeOptions } from "@/features/meetings/editor/server";
import {
  AuthorizationError,
  requireBackendUser,
} from "@/lib/auth/authorization";

export default async function NewMeetingPage() {
  let currentUserId: string;
  try {
    const access = await requireBackendUser();
    currentUserId = access.userId;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.code === "UNAUTHENTICATED") {
        redirect("/login?next=%2Fmeetings%2Fnew");
      }

      return (
        <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
          <div className="w-full max-w-xl">
            <MeetingStatePanel
              description="You do not have permission to create meeting records."
              state="permission"
              title="Access required"
            />
          </div>
        </main>
      );
    }

    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
        <div className="w-full max-w-xl">
          <MeetingStatePanel
            description="Try again. If the problem continues, contact the committee administrator."
            state="system"
            title="Something went wrong"
          />
        </div>
      </main>
    );
  }

  const attendeeResult = await listMeetingAttendeeOptions();

  if (!attendeeResult.ok) {
    return (
      <MeetingStatePanel
        description="Committee profiles could not be loaded. Refresh and try again."
        state={
          attendeeResult.code === "PERMISSION_DENIED"
            ? "permission"
            : "system"
        }
        title={
          attendeeResult.code === "PERMISSION_DENIED"
            ? "Access required"
            : "Something went wrong"
        }
      />
    );
  }

  return (
    <>
      <MeetingPageHeader
        description="Enter the meeting details, then add discussion points and decisions."
        title="Create meeting"
      />
      <MeetingEditorFlow
        createDefaults={meetingCreateDefaults(new Date(), currentUserId, attendeeResult.options)}
        attendeeOptions={attendeeResult.options}
        mode="create"
      />
    </>
  );
}
