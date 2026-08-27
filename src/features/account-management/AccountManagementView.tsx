"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/forms";

import {
  inviteAccountAction,
  sendRecoveryAction,
  setAccountActiveAction,
  updateAccountAction,
} from "./actions";
import {
  INITIAL_ACCOUNT_ACTION_STATE,
  type AccountActionState,
  type ManagedAccount,
} from "./contracts";

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
          Display name
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
          Login email
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
          Committee position
          <input
            aria-describedby={state.fieldErrors?.committeePosition ? "invite-position-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.committeePosition) || undefined}
            className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            maxLength={80}
            name="committeePosition"
            placeholder="Optional, e.g. Secretary"
          />
          <FieldError id="invite-position-error" message={state.fieldErrors?.committeePosition} />
        </label>

        <label className="text-sm font-semibold text-slate-800">
          Data access role
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

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <input className="mt-1 size-4" name="canManageAccounts" type="checkbox" />
        <span>
          <strong className="block text-slate-900">Account administrator</strong>
          Can invite, update, disable and reactivate committee accounts. This does
          not grant participant-data access.
        </span>
      </label>

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
  const [statusState, statusAction, statusPending] = useActionState(
    setAccountActiveAction,
    INITIAL_ACCOUNT_ACTION_STATE,
  );
  const [recoveryState, recoveryAction, recoveryPending] = useActionState(
    sendRecoveryAction,
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
          <p className="mt-1 text-sm text-slate-600">{account.email}</p>
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
              Display name
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

            <label className="text-sm font-semibold text-slate-800" htmlFor={`${fieldPrefix}-position`}>
              Committee position
              <input
                aria-describedby={updateState.fieldErrors?.committeePosition ? `${fieldPrefix}-position-error` : undefined}
                aria-invalid={Boolean(updateState.fieldErrors?.committeePosition) || undefined}
                className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                defaultValue={account.committeePosition ?? ""}
                id={`${fieldPrefix}-position`}
                maxLength={80}
                name="committeePosition"
              />
              <FieldError id={`${fieldPrefix}-position-error`} message={updateState.fieldErrors?.committeePosition} />
            </label>

            <label className="text-sm font-semibold text-slate-800" htmlFor={`${fieldPrefix}-role`}>
              Data access role
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

          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              className="mt-1 size-4"
              defaultChecked={account.canManageAccounts}
              disabled={account.isCurrentUser && account.canManageAccounts}
              name="canManageAccounts"
              type="checkbox"
            />
            <span>
              Account administrator
              {account.isCurrentUser && account.canManageAccounts
                ? " — you cannot revoke your own access."
                : ""}
            </span>
          </label>
          {account.isCurrentUser && account.canManageAccounts ? (
            <input name="canManageAccounts" type="hidden" value="on" />
          ) : null}

          <ActionFeedback state={updateState} />
          <SubmitButton pending={updatePending} pendingLabel="Saving…">
            Save account
          </SubmitButton>
        </form>
      </details>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
        <form action={recoveryAction} className="space-y-2">
          <input name="id" type="hidden" value={account.id} />
          <SubmitButton
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={account.status === "disabled"}
            pending={recoveryPending}
            pendingLabel="Sending…"
          >
            Send password recovery
          </SubmitButton>
          <ActionFeedback state={recoveryState} />
        </form>

        <form action={statusAction} className="space-y-2">
          <input name="id" type="hidden" value={account.id} />
          <input
            name="isActive"
            type="hidden"
            value={account.status === "disabled" ? "true" : "false"}
          />
          <SubmitButton
            className={
              account.status === "disabled"
                ? "inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-950 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                : "inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            }
            disabled={account.isCurrentUser}
            pending={statusPending}
            pendingLabel={account.status === "disabled" ? "Reactivating…" : "Disabling…"}
          >
            {account.status === "disabled" ? "Reactivate account" : "Disable account"}
          </SubmitButton>
          <ActionFeedback state={statusState} />
        </form>
      </div>
    </article>
  );
}

export function AccountDirectory({
  accounts,
}: Readonly<{ accounts: readonly ManagedAccount[] }>) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="font-bold text-slate-950">No committee accounts</h2>
        <p className="mt-2 text-sm text-slate-600">
          Invite the first additional committee member using the form above.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {accounts.map((account) => (
        <AccountCard account={account} key={account.id} />
      ))}
    </div>
  );
}
