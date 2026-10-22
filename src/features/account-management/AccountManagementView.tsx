"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/forms";

import {
  inviteAccountAction,
  updateAccountAction,
} from "./actions";
import {
  INITIAL_ACCOUNT_ACTION_STATE,
  type AccountActionState,
  type ManagedAccount,
} from "./contracts";
import { AccountStatusForm } from "./AccountStatusForm";
import { RecoveryEmailForm } from "./RecoveryEmailForm";

function ActionFeedback({ state }: Readonly<{ state: AccountActionState }>) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p
      aria-live={state.status === "success" ? "polite" : "assertive"}
      className={
        state.status === "success"
          ? "rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 ring-1 ring-inset ring-emerald-200"
          : "rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 ring-1 ring-inset ring-rose-200"
      }
      role={state.status === "success" ? "status" : "alert"}
    >
      {state.message}
    </p>
  );
}

function FieldError({ id, message }: Readonly<{ id?: string; message?: string }>) {
  return message ? <p className="mt-1 text-sm text-rose-700" id={id}>{message}</p> : null;
}

export function InviteAccountForm() {
  const [state, action, pending] = useActionState(
    inviteAccountAction,
    INITIAL_ACCOUNT_ACTION_STATE,
  );

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-800">
          Name
          <input
            aria-describedby={state.fieldErrors?.displayName ? "invite-display-name-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.displayName) || undefined}
            className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            maxLength={120}
            name="displayName"
            required
          />
          <FieldError id="invite-display-name-error" message={state.fieldErrors?.displayName} />
        </label>

        <label className="text-sm font-semibold text-slate-800">
          Email
          <input
            aria-describedby={state.fieldErrors?.email ? "invite-email-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.email) || undefined}
            autoComplete="email"
            className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            maxLength={254}
            name="email"
            required
            type="email"
          />
          <FieldError id="invite-email-error" message={state.fieldErrors?.email} />
        </label>


        <label className="text-sm font-semibold text-slate-800">
          Role
          <select
            aria-describedby={state.fieldErrors?.role ? "invite-role-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.role) || undefined}
            className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            defaultValue="committee"
            name="role"
          >
            <option value="committee">Committee</option>
            <option value="authorised">Authorised</option>
          </select>
          <FieldError id="invite-role-error" message={state.fieldErrors?.role} />
        </label>
      </div>


      <ActionFeedback state={state} />
      <SubmitButton pending={pending} pendingLabel="Sending invitation…">
        Invite committee member
      </SubmitButton>
    </form>
  );
}

const STATUS_STYLES: Readonly<Record<ManagedAccount["status"], string>> = {
  active: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  disabled: "bg-slate-100 text-slate-700 ring-slate-300",
  invited: "bg-amber-50 text-amber-900 ring-amber-200",
};

function AccountCard({ account }: Readonly<{ account: ManagedAccount }>) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateAccountAction,
    INITIAL_ACCOUNT_ACTION_STATE,
  );
  const fieldPrefix = `account-${account.id}`;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">
            {account.displayName}
            {account.isCurrentUser ? (
              <span className="ml-2 text-sm font-medium text-slate-500">You</span>
            ) : null}
          </h3>
          <p className="mt-1 break-all text-sm text-slate-600">{account.email}</p>
          <p className="mt-2 text-sm font-semibold text-emerald-900">
            {account.canManageAccounts ? "Superuser" : account.role === "authorised" ? "Authorised" : "Committee"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ring-inset ${STATUS_STYLES[account.status]}`}
        >
          {account.status}
        </span>
      </div>

      <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50">
        <summary className="flex min-h-11 cursor-pointer items-center px-4 py-3 text-sm font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
          Edit account details
        </summary>
        <form action={updateAction} className="space-y-4 border-t border-slate-200 p-4">
          <input name="id" type="hidden" value={account.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor={`${fieldPrefix}-name`}>
              Name
              <input
                aria-describedby={updateState.fieldErrors?.displayName ? `${fieldPrefix}-name-error` : undefined}
                aria-invalid={Boolean(updateState.fieldErrors?.displayName) || undefined}
                className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                defaultValue={account.displayName}
                id={`${fieldPrefix}-name`}
                maxLength={120}
                name="displayName"
                required
              />
              <FieldError id={`${fieldPrefix}-name-error`} message={updateState.fieldErrors?.displayName} />
            </label>


            <label className="text-sm font-semibold text-slate-800" htmlFor={`${fieldPrefix}-role`}>
              Role
              <select
                aria-describedby={updateState.fieldErrors?.role ? `${fieldPrefix}-role-error` : undefined}
                aria-invalid={Boolean(updateState.fieldErrors?.role) || undefined}
                className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                defaultValue={account.role}
                id={`${fieldPrefix}-role`}
                name="role"
              >
                <option value="committee">Committee</option>
                <option value="authorised">Authorised</option>
              </select>
              <FieldError id={`${fieldPrefix}-role-error`} message={updateState.fieldErrors?.role} />
            </label>
          </div>

          <input name="committeePosition" type="hidden" value={account.committeePosition ?? ""} />
          {account.canManageAccounts ? <input name="canManageAccounts" type="hidden" value="on" /> : null}

          <ActionFeedback state={updateState} />
          <SubmitButton pending={updatePending} pendingLabel="Saving…">
            Save account
          </SubmitButton>
        </form>
      </details>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
        <RecoveryEmailForm accountId={account.id} disabled={account.status === "disabled"} />

        <AccountStatusForm accountId={account.id} isDisabled={account.status === "disabled"} isCurrentUser={account.isCurrentUser} />
      </div>
    </article>
  );
}

export function AccountDirectory({
  accounts,
}: Readonly<{ accounts: readonly ManagedAccount[] }>) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const members = accounts.filter(account => !account.isCurrentUser);
  const search = query.trim().toLowerCase();
  const matches = members.filter(account =>
    (status === "all" || account.status === status) &&
    (!search || `${account.displayName} ${account.email}`.toLowerCase().includes(search)),
  );
  const pageCount = Math.max(1, Math.ceil(matches.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visible = matches.slice((currentPage - 1) * 10, currentPage * 10);
  const controlClass = "min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="font-bold text-slate-950">No committee accounts</h2>
        <p className="mt-2 text-sm text-slate-600">
          Invite a committee member using the form above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-semibold text-slate-800">
          Search accounts
          <input type="search" placeholder="Name or email" className={controlClass} value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
          Status
          <select className={controlClass} value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
      </div>
      <p className="text-sm text-slate-600" role="status">
        {matches.length === 0 ? "No matching accounts" : `Showing ${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, matches.length)} of ${matches.length} accounts`}
      </p>
      {visible.map((account) => (
        <AccountCard account={account} key={account.id} />
      ))}
      {matches.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">Try another name, email or status.</p> : null}
      {pageCount > 1 ? (
        <nav aria-label="Account pages" className="flex flex-wrap items-center justify-between gap-3">
          <button className={`${controlClass} disabled:opacity-50`} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} type="button">Previous</button>
          <span className="text-sm text-slate-600">Page {currentPage} of {pageCount}</span>
          <button className={`${controlClass} disabled:opacity-50`} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} type="button">Next</button>
        </nav>
      ) : null}
    </div>
  );
}
