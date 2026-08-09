"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/(auth)/actions";
import {
  AUTH_ERROR_CODES,
  type LoginActionState,
} from "@/lib/auth/contracts";

const INITIAL_LOGIN_STATE: LoginActionState = { error: null };

function getLoginErrorMessage(error: LoginActionState["error"]) {
  if (error === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
    return "The email or password is incorrect.";
  }

  if (error === AUTH_ERROR_CODES.SERVICE_UNAVAILABLE) {
    return "Sign-in is temporarily unavailable. Please try again.";
  }

  return null;
}

export function LoginForm({ nextPath }: Readonly<{ nextPath: string }>) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    INITIAL_LOGIN_STATE,
  );
  const errorMessage = getLoginErrorMessage(state.error);

  return (
    <form action={formAction} className="grid gap-4">
      <input name="next" type="hidden" value={nextPath} />

      <label className="grid gap-1" htmlFor="email">
        <span>Email</span>
        <input
          autoComplete="email"
          className="rounded border border-current px-3 py-2"
          id="email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>

      <label className="grid gap-1" htmlFor="password">
        <span>Password</span>
        <input
          autoComplete="current-password"
          className="rounded border border-current px-3 py-2"
          id="password"
          maxLength={1024}
          name="password"
          required
          type="password"
        />
      </label>

      <p aria-live="polite" className="min-h-6 text-sm text-red-700">
        {errorMessage}
      </p>

      <button
        className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
