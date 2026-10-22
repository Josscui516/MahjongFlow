"use client";

import { useActionState, useEffect, useState } from "react";
import { SubmitButton } from "@/components/forms";
import { sendRecoveryAction } from "./actions";
import { INITIAL_ACCOUNT_ACTION_STATE } from "./contracts";

export function RecoveryEmailForm({ accountId, disabled }: Readonly<{ accountId: string; disabled: boolean }>) {
  const [sent, setSent] = useState(false);
  const [state, action, pending] = useActionState(async (previous: typeof INITIAL_ACCOUNT_ACTION_STATE, data: FormData) => {
    if (sent || disabled) return previous;
    const result = await sendRecoveryAction(previous, data);
    if (result.status === "success") setSent(true);
    return result;
  }, INITIAL_ACCOUNT_ACTION_STATE);

  useEffect(() => {
    if (!sent) return;
    const timer = window.setTimeout(() => setSent(false), 5000);
    return () => window.clearTimeout(timer);
  }, [sent]);

  return (
    <form action={action} className="space-y-2">
      <input name="id" type="hidden" value={accountId} />
      <SubmitButton
        className={`inline-flex min-h-11 min-w-48 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed ${sent ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-60"}`}
        disabled={disabled || sent}
        pending={pending}
        pendingLabel="Sending…"
      >
        {sent ? <><span aria-hidden="true">✓</span> Sent</> : "Send password recovery"}
      </SubmitButton>
      <span className="sr-only" role="status">{sent ? "Password recovery email sent." : ""}</span>
      {state.status === "error" ? <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 ring-1 ring-inset ring-rose-200">{state.message}</p> : null}
    </form>
  );
}
