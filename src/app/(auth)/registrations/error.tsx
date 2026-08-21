"use client";

import { useEffect } from "react";

import {
  PRIMARY_ROUTE_ACTION_CLASS,
  RouteErrorFeedback,
  SECONDARY_ROUTE_ACTION_CLASS,
} from "@/components/feedback";

export default function RegistrationsError({
  error,
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  useEffect(() => {
    console.error("Registrations route failed", {
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
              <a className={SECONDARY_ROUTE_ACTION_CLASS} href="/backoffice">
                Return to back office
              </a>
            </>
          }
          description="The registrations workspace could not be prepared. Retry the request, or return to the back office without displaying participant information."
          note="No participant information was displayed or changed."
          recoveryItems={[
            "Retry authorised access and data loading",
            "Return to the back office if the service remains unavailable",
          ]}
          title="Registrations unavailable"
        />
      </div>
    </main>
  );
}
