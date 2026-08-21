"use client";

import Link from "next/link";
import { useEffect } from "react";

import {
  PRIMARY_ROUTE_ACTION_CLASS,
  RouteErrorFeedback,
  SECONDARY_ROUTE_ACTION_CLASS,
} from "@/components/feedback";
import { PageFrame } from "@/components/layout";

export default function AccountManagementError({
  error,
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  useEffect(() => {
    console.error("Account management route failed", {
      digest: error.digest ?? "unavailable",
    });
  }, [error.digest]);

  return (
    <PageFrame
      description="Invite committee members, maintain roles, and manage account access."
      title="Committee accounts"
    >
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
            <Link className={SECONDARY_ROUTE_ACTION_CLASS} href="/backoffice">
              Return to back office
            </Link>
          </>
        }
        description="The account directory could not be loaded. Try again, or return to the back office and come back later."
        note="No confirmed account changes were made."
        recoveryItems={[
          "Retry loading the account directory",
          "Return to the back office if the account service remains unavailable",
        ]}
        title="Account service unavailable"
      />
    </PageFrame>
  );
}
