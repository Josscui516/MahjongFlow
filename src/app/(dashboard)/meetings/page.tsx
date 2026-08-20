import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { BackofficeShell } from "@/components/layout";
import {
  MeetingHistoryPageView,
  MeetingHistoryPermissionDeniedView,
  MeetingHistorySystemErrorView,
  resolveMeetingHistoryScreen,
  type MeetingHistoryRole,
} from "@/features/meetings/history";
import {
  getMeetingHistoryAccess,
  queryMeetingHistory,
} from "@/features/meetings/history/server";

const STANDALONE_MAIN_CLASS =
  "mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-10";

function MeetingHistoryShell({
  children,
  role,
}: Readonly<{
  children: ReactNode;
  role: MeetingHistoryRole;
}>) {
  return (
    <BackofficeShell
      accountSlot={<span>Signed in</span>}
      currentPath="/meetings"
      role={role}
      signOutSlot={<LogoutForm />}
    >
      {children}
    </BackofficeShell>
  );
}

export default async function MeetingsPage() {
  const state = await resolveMeetingHistoryScreen({
    getAccess: getMeetingHistoryAccess,
    queryHistory: queryMeetingHistory,
  });

  switch (state.status) {
    case "unauthenticated":
      redirect("/login?next=%2Fmeetings");
    case "permission-denied":
      return (
        <main className={STANDALONE_MAIN_CLASS}>
          <MeetingHistoryPermissionDeniedView />
        </main>
      );
    case "system-error":
      return state.role ? (
        <MeetingHistoryShell role={state.role}>
          <MeetingHistorySystemErrorView />
        </MeetingHistoryShell>
      ) : (
        <main className={STANDALONE_MAIN_CLASS}>
          <MeetingHistorySystemErrorView />
        </main>
      );
    case "ready":
      return (
        <MeetingHistoryShell role={state.role}>
          <MeetingHistoryPageView items={state.items} />
        </MeetingHistoryShell>
      );
  }
}
