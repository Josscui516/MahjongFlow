"use client";

import { useEffect } from "react";

import {
  PRIMARY_ROUTE_ACTION_CLASS,
  RouteErrorFeedback,
  SECONDARY_ROUTE_ACTION_CLASS,
} from "@/components/feedback";

export default function AccountPasswordError({
  error,
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  useEffect(() => {
    console.error("Account password route failed", {
      digest: error.digest ?? "unavailable",
    });
  }, [error.digest]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-slate-950">
      <div className="w-full max-w-4xl">
        <RouteErrorFeedback
          actions={
            <>
              <button
                className={PRIMARY_ROUTE_ACTION_CLASS}
                onClick={retry}
                type="button"
              >
                Try again
              </button>
              <a className={SECONDARY_ROUTE_ACTION_CLASS} href="/login">
                Return to sign in
              </a>
            </>
          }
          description="The password setup page could not prepare your secure session. Retry the link, or return to sign in and request a new recovery email."
          note="Your password was not changed."
          recoveryItems={[
            "Retry the invitation or recovery session",
            "Return to sign in and request a new email if the link has expired",
          ]}
          title="Password setup unavailable"
        />
      </div>
    </main>
  );
}
