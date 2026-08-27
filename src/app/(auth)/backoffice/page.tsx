import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import {
  PermissionDeniedFeedback,
  PRIMARY_ROUTE_ACTION_CLASS,
  SECONDARY_ROUTE_ACTION_CLASS,
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
      accountSlot={<span>{context.displayName}</span>}
      canManageAccounts={context.canManageAccounts}
      currentPath="/backoffice"
      role={context.role}
      signOutSlot={<LogoutForm />}
    >
      <PageFrame
        description="Move committee work forward from meeting decisions to owned, trackable tasks."
        title="Committee dashboard"
      >
        <section
          aria-labelledby="workspaces-title"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-950" id="workspaces-title">
              Workspaces
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Review committee records or continue work that needs an owner.
            </p>
          </div>
          <div className="divide-y divide-slate-200">
            <Link
              className="group flex min-h-24 items-center justify-between gap-5 px-5 py-4 transition hover:bg-emerald-50/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-700 sm:px-6"
              href="/meetings"
            >
              <span>
                <span className="block font-semibold text-slate-950">Meetings</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">
                  Create meeting records, manage agendas, and capture decisions.
                </span>
              </span>
              <span aria-hidden="true" className="text-xl text-emerald-800 transition group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              className="group flex min-h-24 items-center justify-between gap-5 px-5 py-4 transition hover:bg-emerald-50/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-700 sm:px-6"
              href="/tasks"
            >
              <span>
                <span className="block font-semibold text-slate-950">Tasks</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">
                  Assign actions, track due dates, and review delivery status.
                </span>
              </span>
              <span aria-hidden="true" className="text-xl text-emerald-800 transition group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="access-title"
          className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-6"
        >
          <h2 className="font-semibold text-emerald-950" id="access-title">
            Your access
          </h2>
          <p className="mt-2 text-sm leading-6 text-emerald-950/80">
            You are signed in as {context.displayName}. Your role and data permissions
            are verified on the server for every protected workspace.
          </p>
        </section>
      </PageFrame>
    </BackofficeShell>
  );
}
