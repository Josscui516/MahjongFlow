import { redirect } from "next/navigation";

import { FixtureMeetingEditorFlow } from "@/features/meetings/editor/FixtureMeetingEditorFlow";
import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import { MeetingRouteShell } from "@/features/meetings/editor/MeetingRouteShell";
import { MeetingStatePanel } from "@/features/meetings/editor/MeetingStatePanel";
import {
  AuthorizationError,
  requireBackendUser,
} from "@/lib/auth/authorization";

export default async function NewMeetingPage() {
  let context;

  try {
    context = await requireBackendUser();
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

  return (
    <MeetingRouteShell currentPath="/meetings/new" role={context.role}>
      <MeetingPageHeader
        description="Record committee-safe meeting details, participants, discussion points and decisions."
        title="Create meeting"
      />
      <FixtureMeetingEditorFlow mode="create" />
    </MeetingRouteShell>
  );
}
