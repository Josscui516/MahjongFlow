import { redirect } from "next/navigation";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import {
  PermissionDeniedFeedback,
  PRIMARY_ROUTE_ACTION_CLASS,
  SECONDARY_ROUTE_ACTION_CLASS,
  SuccessFeedback,
  SystemErrorFeedback,
} from "@/components/feedback";
import { BackofficeShell, PageFrame } from "@/components/layout";
import {
  AuthorizationError,
  requireBackendUser,
  type AccessContext,
} from "@/lib/auth/authorization";

function AccessUnavailable({ forbidden }: Readonly<{ forbidden: boolean }>) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-slate-950">
      <div className="w-full max-w-2xl">
        {forbidden ? (
          <PermissionDeniedFeedback
            backAction={
              <a className={SECONDARY_ROUTE_ACTION_CLASS} href="/login">
                Return to sign in
              </a>
            }
          />
        ) : (
          <SystemErrorFeedback
            action={
              <a className={PRIMARY_ROUTE_ACTION_CLASS} href="/backoffice">
                Try again
              </a>
            }
          />
        )}
      </div>
    </main>
  );
}

export default async function BackofficePage() {
  let context: AccessContext;

  try {
    context = await requireBackendUser();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.code === "UNAUTHENTICATED") {
        redirect("/login?next=%2Fbackoffice");
      }

      return <AccessUnavailable forbidden />;
    }

    return <AccessUnavailable forbidden={false} />;
  }

  return (
    <BackofficeShell
      accountSlot={<span>Signed in</span>}
      canManageAccounts={context.canManageAccounts}
      role={context.role}
      signOutSlot={<LogoutForm />}
    >
      <PageFrame
        description="Authentication, trusted role resolution, and database permission boundaries are connected for the Sprint 2 foundation demo."
        feedbackSlot={
          <SuccessFeedback
            message="Your session and committee role were verified on the server."
            title="Foundation ready"
          />
        }
        title="Back-office foundation"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">Current access</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Role-aware navigation is derived from the trusted server-side
              access context. Sensitive links are shown only to authorised
              users.
            </p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">Next modules</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Meetings, tasks, events, and dashboard data will be added in
              later work packages without weakening this access boundary.
            </p>
          </section>
        </div>
      </PageFrame>
    </BackofficeShell>
  );
}
