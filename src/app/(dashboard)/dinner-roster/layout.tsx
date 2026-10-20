import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { PermissionDeniedFeedback, SystemErrorFeedback } from "@/components/feedback";
import { BackofficeShell } from "@/components/layout";
import { AuthorizationError, requireBackendUser } from "@/lib/auth/authorization";

export default async function DinnerRosterLayout({ children }: Readonly<{ children: ReactNode }>) {
  let access: Awaited<ReturnType<typeof requireBackendUser>>;
  try { access = await requireBackendUser(); }
  catch (error) {
    if (error instanceof AuthorizationError && error.code === "UNAUTHENTICATED") redirect("/login?next=%2Fdinner-roster");
    return <main className="mx-auto max-w-7xl px-4 py-8">{error instanceof AuthorizationError ? <PermissionDeniedFeedback /> : <SystemErrorFeedback />}</main>;
  }
  return <BackofficeShell currentPath="/dinner-roster" role={access.role} canManageAccounts={access.canManageAccounts}
    accountSlot={<span>Signed in as <strong>{access.displayName?.trim() || "Authorised staff"}</strong></span>}
    signOutSlot={<LogoutForm />}>
    {children}
  </BackofficeShell>;
}
