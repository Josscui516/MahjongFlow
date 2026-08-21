import { redirect } from "next/navigation";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { BackofficeShell } from "@/components/layout";
import {
  AccountDirectory,
  getAccountManagementService,
  InviteAccountForm,
} from "@/features/account-management";
import {
  AuthorizationError,
  requireAccountAdmin,
} from "@/lib/auth/authorization";

function AccessFailure({ system }: Readonly<{ system: boolean }>) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
          Account administration
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">
          {system ? "Account service unavailable" : "Access required"}
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          {system
            ? "We could not load the account directory. Refresh the page and try again."
            : "Your committee account does not have account-administration access."}
        </p>
      </section>
    </main>
  );
}

export default async function AccountManagementPage() {
  let context;

  try {
    context = await requireAccountAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.code === "UNAUTHENTICATED") {
        redirect("/login?next=%2Fadmin%2Fusers");
      }

      return <AccessFailure system={false} />;
    }

    return <AccessFailure system />;
  }

  let accounts;

  try {
    const service = await getAccountManagementService();
    accounts = await service.listAccounts();
  } catch {
    return <AccessFailure system />;
  }

  return (
    <BackofficeShell
      accountSlot={<span>Signed in</span>}
      canManageAccounts
      currentPath="/admin/users"
      role={context.role}
      signOutSlot={<LogoutForm />}
    >
      <div className="space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Committee accounts
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Invite individual committee members, maintain their coordination and
            participant-data roles, and disable access without deleting meeting or
            task history.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-slate-950">Invite a member</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The member receives an email link and chooses their own password. Passwords
            are never visible to committee administrators.
          </p>
          <div className="mt-6">
            <InviteAccountForm />
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="account-directory-title">
          <div>
            <h2 className="text-xl font-bold text-slate-950" id="account-directory-title">
              Current accounts
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Disabled accounts remain in historical committee records but cannot use
              the back office.
            </p>
          </div>
          <AccountDirectory accounts={accounts} />
        </section>
      </div>
    </BackofficeShell>
  );
}
