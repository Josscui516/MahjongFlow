"use client";

import { useActionState, useEffect, useState } from "react";
import { SubmitButton } from "@/components/forms";
import { setAccountActiveAction } from "./actions";
import { INITIAL_ACCOUNT_ACTION_STATE } from "./contracts";

export function AccountStatusForm({ accountId, isDisabled, isCurrentUser }: Readonly<{
  accountId: string; isDisabled: boolean; isCurrentUser: boolean;
}>) {
  const [completed, setCompleted] = useState<"Disabled" | "Reactivated" | null>(null);
  const [state, action, pending] = useActionState(async (previous: typeof INITIAL_ACCOUNT_ACTION_STATE, data: FormData) => {
    if (completed || isCurrentUser) return previous;
    const result = await setAccountActiveAction(previous, data);
    if (result.status === "success") {
      setCompleted(data.get("isActive") === "true" ? "Reactivated" : "Disabled");
    }
    return result;
  }, INITIAL_ACCOUNT_ACTION_STATE);

  useEffect(() => {
    if (!completed) return;
    const timer = window.setTimeout(() => setCompleted(null), 5000);
    return () => window.clearTimeout(timer);
  }, [completed]);

  return (
    <form action={action} className="space-y-2">
      <input name="id" type="hidden" value={accountId} />
      <input name="isActive" type="hidden" value={isDisabled ? "true" : "false"} />
      <SubmitButton
        className={`inline-flex min-h-11 min-w-40 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed ${completed ? "border-emerald-200 bg-emerald-50 text-emerald-900" : isDisabled ? "border-emerald-950 bg-emerald-950 text-white hover:bg-emerald-900 disabled:opacity-60" : "border-rose-300 bg-white text-rose-800 hover:bg-rose-50 disabled:opacity-60"}`}
        disabled={isCurrentUser || Boolean(completed)}
        aria-describedby={isCurrentUser ? `account-${accountId}-disable-help` : undefined}
        pending={pending}
        pendingLabel={isDisabled ? "Reactivating…" : "Disabling…"}
      >
        {completed ? <><span aria-hidden="true">✓</span> {completed}</> : isDisabled ? "Reactivate account" : "Disable account"}
      </SubmitButton>
      <span className="sr-only" role="status">{completed ? `Account ${completed.toLowerCase()}.` : ""}</span>
      {isCurrentUser ? <p className="max-w-sm text-sm text-slate-600" id={`account-${accountId}-disable-help`}>You cannot disable your own account. Ask another Superuser to manage your access.</p> : null}
      {state.status === "error" ? <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 ring-1 ring-inset ring-rose-200">{state.message}</p> : null}
    </form>
  );
}
