import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { PermissionDeniedFeedback, SystemErrorFeedback } from "@/components/feedback";
import { BackofficeShell } from "@/components/layout";
import { AuthorizationError, requireBackendUser } from "@/lib/auth/authorization";

const STANDALONE_MAIN_CLASS =
  "mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-10";

export default async function TasksLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  let access: Awaited<ReturnType<typeof requireBackendUser>> | undefined;
  let accessError: unknown;

  try {
    access = await requireBackendUser();
  } catch (error) {
    accessError = error;
  }

  if (!access) {
    if (accessError instanceof AuthorizationError && accessError.code === "UNAUTHENTICATED") {
      redirect("/login?next=%2Ftasks");
    }

    return (
      <main className={STANDALONE_MAIN_CLASS}>
        {accessError instanceof AuthorizationError ? (
          <PermissionDeniedFeedback />
        ) : (
          <SystemErrorFeedback />
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
            {access.displayName?.trim() || "Committee member"}
          </strong>
        </span>
      }
      canManageAccounts={access.canManageAccounts}
      currentPath="/tasks"
      role={access.role}
      signOutSlot={<LogoutForm />}
    >
      {children}
    </BackofficeShell>
  );
}
