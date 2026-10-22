import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { PermissionDeniedFeedback, SystemErrorFeedback } from "@/components/feedback";
import { BackofficeShell } from "@/components/layout";
import { AuthorizationError, requireAuthorised } from "@/lib/auth/authorization";

export default async function DinnerLayout({ children }: Readonly<{ children: ReactNode }>) {
  let access: Awaited<ReturnType<typeof requireAuthorised>>;
  try { access = await requireAuthorised(); }
  catch (error) {
    if (error instanceof AuthorizationError && error.code === "UNAUTHENTICATED") redirect("/login?next=%2Fdinner-verification");
    return <main className="mx-auto max-w-7xl px-4 py-8">{error instanceof AuthorizationError ? <PermissionDeniedFeedback /> : <SystemErrorFeedback />}</main>;
  }
  return <BackofficeShell currentPath="/dinner-verification" role={access.role} canManageAccounts={access.canManageAccounts}
    displayName={access.displayName}
    signOutSlot={<LogoutForm />}>
    {children}
  </BackofficeShell>;
}
