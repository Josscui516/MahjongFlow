"use client";

import { useActionState } from "react";

import { logoutAction } from "@/app/(auth)/actions";
import type { LogoutActionState } from "@/lib/auth/contracts";

const INITIAL_LOGOUT_STATE: LogoutActionState = { error: null };

export function LogoutForm() {
  const [state, formAction, pending] = useActionState(
    logoutAction,
    INITIAL_LOGOUT_STATE,
  );

  return (
    <form action={formAction} className="grid gap-2">
      {state.error ? (
        <p aria-live="polite" className="text-sm text-red-700">
          Sign-out is temporarily unavailable. Please try again.
        </p>
      ) : null}
      <button
        className="rounded border border-current px-4 py-2 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </form>
  );
}
