import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { PermissionDeniedFeedback, SystemErrorFeedback } from "@/components/feedback";
import { BackofficeShell } from "@/components/layout";
import { AuthorizationError, requireBackendUser } from "@/lib/auth/authorization";

export default async function AttendanceLayout({ children, params }: Readonly<{
  children: ReactNode;
  params: Promise<{ eventId: string }>;
}>) {
  const { eventId } = await params;
  let access;
  try {
    access = await requireBackendUser();
  } catch (error) {
    if (error instanceof AuthorizationError && error.code === "UNAUTHENTICATED") {
      redirect(`/login?next=${encodeURIComponent(`/attendance/${eventId}`)}`);
    }
    return <main className="mx-auto w-full max-w-7xl px-4 py-8">
      {error instanceof AuthorizationError ? <PermissionDeniedFeedback /> : <SystemErrorFeedback />}
    </main>;
  }

  return <BackofficeShell
    canManageAccounts={access.canManageAccounts}
    currentPath="/events"
    displayName={access.displayName}
    role={access.role}
    signOutSlot={<LogoutForm />}
  >{children}</BackofficeShell>;
}
