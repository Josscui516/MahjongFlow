import { redirect } from "next/navigation";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { SuccessFeedback } from "@/components/feedback";
import { BackofficeShell, PageFrame } from "@/components/layout";
import {
  AuthorizationError,
  requireBackendUser,
  type AccessContext,
} from "@/lib/auth/authorization";

function AccessUnavailable({ forbidden }: Readonly<{ forbidden: boolean }>) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-slate-950">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
          MahjongFlow
        </p>
        <h1 className="mt-2 text-2xl font-bold">
          {forbidden ? "Back-office access unavailable" : "Service unavailable"}
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          {forbidden
            ? "Your account does not currently have a committee role. Contact the committee administrator if you need access."
            : "We could not verify your access right now. Please try again."}
        </p>
      </section>
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
