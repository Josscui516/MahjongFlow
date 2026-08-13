"use client";

import { useActionState, type ComponentProps } from "react";

import { loginAction } from "@/app/(auth)/actions";
import { AuthErrorFeedback } from "@/components/feedback";
import { FormField, SubmitButton } from "@/components/forms";
import { type LoginActionState } from "@/lib/auth/contracts";

const INITIAL_LOGIN_STATE: LoginActionState = { error: null };

type LoginFormViewProps = Readonly<{
  error: LoginActionState["error"];
  formAction: ComponentProps<"form">["action"];
  nextPath: string;
  pending: boolean;
}>;

export function LoginFormView({
  error,
  formAction,
  nextPath,
  pending,
}: LoginFormViewProps) {
  return (
    <form action={formAction} className="space-y-5">
      <input name="next" type="hidden" value={nextPath} />

      <FormField
        control={
          <input
            autoComplete="email"
            maxLength={254}
            name="email"
            type="email"
          />
        }
        description="Use the email address assigned to your committee account."
        id="email"
        label="Email"
        required
      />

      <FormField
        control={
          <input
            autoComplete="current-password"
            maxLength={1024}
            name="password"
            type="password"
          />
        }
        id="password"
        label="Password"
        required
      />

      {error ? <AuthErrorFeedback code={error} /> : null}

      <SubmitButton
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        pending={pending}
        pendingLabel="Signing in…"
      >
        Sign in
      </SubmitButton>
    </form>
  );
}

export function LoginForm({ nextPath }: Readonly<{ nextPath: string }>) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    INITIAL_LOGIN_STATE,
  );

  return (
    <LoginFormView
      error={state.error}
      formAction={formAction}
      nextPath={nextPath}
      pending={pending}
    />
  );
}
