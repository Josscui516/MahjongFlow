import {
  AccountDirectory,
  getAccountManagementService,
  InviteAccountForm,
} from "@/features/account-management";
import { PermissionDeniedFeedback } from "@/components/feedback";
import { AuthorizationError } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export default async function AccountManagementPage() {
  const service = await getAccountManagementService();
  let accounts;
  try {
    accounts = await service.listAccounts();
  } catch (error) {
    // Pages and layouts render concurrently: the layout cannot catch this read.
    if (error instanceof AuthorizationError) return <PermissionDeniedFeedback />;
    throw error;
  }

  return (
    <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Committee accounts
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Invite individual committee members, maintain their coordination and
            participant-data roles, and disable access without deleting meeting or
            task history.
          </p>
        </header>

        <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 text-base font-bold text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:px-6">
            Invite member
            <span className="text-sm font-medium text-slate-500 group-open:hidden">Expand form</span>
            <span className="hidden text-sm font-medium text-slate-500 group-open:inline">Collapse form</span>
          </summary>
          <div className="border-t border-slate-200 p-5 sm:p-6">
          <div>
            <InviteAccountForm />
          </div>
          </div>
        </details>

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
  );
}
