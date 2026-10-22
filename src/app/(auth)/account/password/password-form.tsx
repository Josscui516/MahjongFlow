"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

import {
  createPasswordSessionInitializer,
  type PasswordAuthClient,
  type PasswordSessionInitializer,
  updatePasswordForTarget,
} from "./password-session";

type PasswordState = Readonly<{
  message: string;
  status: "error" | "idle" | "pending" | "success";
}>;

const INITIAL_STATE: PasswordState = { message: "", status: "idle" };

export function PasswordSetupForm() {
  const [state, setState] = useState(INITIAL_STATE);
  const [linkState, setLinkState] = useState<"checking" | "ready" | "unavailable">(
    "checking",
  );
  const clientRef = useRef<PasswordAuthClient | null>(null);
  const initializeSessionRef = useRef<PasswordSessionInitializer | null>(null);
  const targetUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hash = window.location.hash;

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );

    const client = clientRef.current ?? createBrowserSupabaseClient();
    clientRef.current ??= client;
    initializeSessionRef.current ??= createPasswordSessionInitializer(client, hash);

    void initializeSessionRef.current()
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (result.status === "unavailable") {
          setLinkState("unavailable");
          return;
        }

        targetUserIdRef.current = result.userId;
        setLinkState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setLinkState("unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = formData.get("password");
    const confirmation = formData.get("confirmation");

    if (typeof password !== "string" || password.length < 12) {
      setState({
        message: "Use at least 12 characters for your password.",
        status: "error",
      });
      return;
    }

    if (password !== confirmation) {
      setState({ message: "The passwords do not match.", status: "error" });
      return;
    }

    setState({ message: "", status: "pending" });

    try {
      const client = clientRef.current;
      const targetUserId = targetUserIdRef.current;

      if (!client || !targetUserId) {
        setState({
          message:
            "This invitation or recovery link is unavailable or has expired. Ask an account administrator to send a new email.",
          status: "error",
        });
        return;
      }

      const result = await updatePasswordForTarget(client, targetUserId, password);

      if (result !== "SUCCESS") {
        setState({
          message:
            result === "SESSION_MISMATCH"
              ? "This browser session does not match the invitation. Request a new email and try again."
              : "The password could not be updated. Request a new email and try again.",
          status: "error",
        });
        return;
      }

      setState({
        message: "Password saved. Opening your back office…",
        status: "success",
      });
      form.reset();
      window.location.replace("/backoffice");
    } catch {
      setState({
        message: "The authentication service is unavailable. Try again shortly.",
        status: "error",
      });
    }
  }

  if (linkState === "checking") {
    return (
      <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700" role="status">
        Verifying your secure account link…
      </p>
    );
  }

  if (linkState === "unavailable") {
    return (
      <div className="space-y-4">
        <p
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900"
          role="alert"
        >
          This invitation or recovery link is unavailable or has expired. Ask an
          account administrator to send a new email.
        </p>
        <Link
          className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
          href="/login"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submitPassword}>
      <label className="block text-sm font-semibold text-slate-800">
        New password
        <input
          autoComplete="new-password"
          className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          minLength={12}
          name="password"
          required
          type="password"
        />
      </label>

      <label className="block text-sm font-semibold text-slate-800">
        Confirm password
        <input
          autoComplete="new-password"
          className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          minLength={12}
          name="confirmation"
          required
          type="password"
        />
      </label>

      {state.status !== "idle" && state.status !== "pending" ? (
        <p
          aria-live={state.status === "success" ? "polite" : "assertive"}
          className={
            state.status === "success"
              ? "rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"
              : "rounded-xl bg-rose-50 p-3 text-sm text-rose-900"
          }
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </p>
      ) : null}

      <button
        aria-busy={state.status === "pending" || state.status === "success" || undefined}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={state.status === "pending" || state.status === "success"}
        type="submit"
      >
        {state.status === "success" ? "Opening back office…" : state.status === "pending" ? "Saving password…" : "Save password"}
      </button>

    </form>
  );
}
