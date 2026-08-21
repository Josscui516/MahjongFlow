import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import {
  PermissionDeniedFeedback,
  SECONDARY_ROUTE_ACTION_CLASS,
  SystemErrorFeedback,
} from "@/components/feedback";
import { BackofficeShell } from "@/components/layout";
import {
  AuthorizationError,
  requireAccountAdmin,
} from "@/lib/auth/authorization";

const RETURN_ACTION = (
  <a className={SECONDARY_ROUTE_ACTION_CLASS} href="/backoffice">
    Return to back office
  </a>
);

function StandaloneAccessState({ forbidden }: Readonly<{ forbidden: boolean }>) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-slate-950">
      <div className="w-full max-w-2xl">
        {forbidden ? (
          <PermissionDeniedFeedback backAction={RETURN_ACTION} />
        ) : (
          <SystemErrorFeedback action={RETURN_ACTION} />
        )}
      </div>
    </main>
  );
}

export default async function AccountManagementLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  let context;

  try {
    context = await requireAccountAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.code === "UNAUTHENTICATED") {
        redirect("/login?next=%2Fadmin%2Fusers");
      }

      return <StandaloneAccessState forbidden />;
    }

    return <StandaloneAccessState forbidden={false} />;
  }

  return (
    <BackofficeShell
      accountSlot={
        <span>
          Signed in as{" "}
          <strong className="font-semibold text-slate-900">
            {context.displayName?.trim() || "Committee member"}
          </strong>
        </span>
      }
      canManageAccounts
      currentPath="/admin/users"
      role={context.role}
      signOutSlot={<LogoutForm />}
    >
      {children}
    </BackofficeShell>
  );
}
