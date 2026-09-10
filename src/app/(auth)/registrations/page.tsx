import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { listEvents } from "@/features/events/core/service";
import {
  EmptyFeedback,
  PermissionDeniedFeedback,
  SystemErrorFeedback,
} from "@/components/feedback";
import { BackofficeShell, PageFrame } from "@/components/layout";
import {
  AuthorizationError,
  requireAuthorised,
} from "@/lib/auth/authorization";

const BACK_ACTION = (
  <Link
    className="inline-flex min-h-11 items-center rounded-lg border border-current px-3 py-2 text-sm font-semibold"
    href="/backoffice"
  >
    Return to back office
  </Link>
);

function RegistrationAccessFailure({
  forbidden,
}: Readonly<{ forbidden: boolean }>) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-slate-950">
      <div className="w-full max-w-xl">
        {forbidden ? (
          <PermissionDeniedFeedback backAction={BACK_ACTION} />
        ) : (
          <SystemErrorFeedback action={BACK_ACTION} />
        )}
      </div>
    </main>
  );
}

export default async function RegistrationsPage() {
  let canManageAccounts = false;

  try {
    const context = await requireAuthorised();
    canManageAccounts = context.canManageAccounts;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.code === "UNAUTHENTICATED") {
        redirect("/login?next=%2Fregistrations");
      }

      return <RegistrationAccessFailure forbidden />;
    }

    return <RegistrationAccessFailure forbidden={false} />;
  }

  const events = await listEvents();
  return (
    <BackofficeShell
      accountSlot={<span>Signed in</span>}
      canManageAccounts={canManageAccounts}
      currentPath="/registrations"
      role="authorised"
      signOutSlot={<LogoutForm />}
    >
      <PageFrame
        description="Participant registration details are restricted to authorised committee users."
        title="Registrations"
      >
        {!events.ok ? <SystemErrorFeedback /> : events.items.length === 0 ? <EmptyFeedback title="No events available" description="Create an event before registering participants." /> : <ul className="space-y-3">{events.items.map((event) => <li key={event.id}><Link className="block rounded-lg border p-4 font-semibold underline" href={`/registrations/${event.id}`}>{event.name}</Link></li>)}</ul>}
      </PageFrame>
    </BackofficeShell>
  );
}
