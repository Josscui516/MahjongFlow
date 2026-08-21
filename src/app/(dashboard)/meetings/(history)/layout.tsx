import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { BackofficeShell } from "@/components/layout";
import {
  MeetingHistoryPermissionDeniedView,
  MeetingHistorySystemErrorView,
} from "@/features/meetings/history";
import { getMeetingHistoryAccess } from "@/features/meetings/history/server";

const STANDALONE_MAIN_CLASS =
  "mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-10";

export default async function MeetingHistoryLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const access = await getMeetingHistoryAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/login?next=%2Fmeetings");
    }

    return (
      <main className={STANDALONE_MAIN_CLASS}>
        {access.reason === "forbidden" ? (
          <MeetingHistoryPermissionDeniedView />
        ) : (
          <MeetingHistorySystemErrorView />
        )}
      </main>
    );
  }

  return (
    <BackofficeShell
      accountSlot={
        <span>
          Signed in as{" "}
          <strong className="font-semibold text-slate-900">
            {access.context.displayName?.trim() || "Committee member"}
          </strong>
        </span>
      }
      canManageAccounts={access.context.canManageAccounts}
      currentPath="/meetings"
      role={access.context.role}
      signOutSlot={<LogoutForm />}
    >
      {children}
    </BackofficeShell>
  );
}
