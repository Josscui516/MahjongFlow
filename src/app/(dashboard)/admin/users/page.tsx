import {
  AccountDirectory,
  getAccountManagementService,
  InviteAccountForm,
} from "@/features/account-management";

export default async function AccountManagementPage() {
  const service = await getAccountManagementService();
  const accounts = await service.listAccounts();

  return (
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
  );
}
