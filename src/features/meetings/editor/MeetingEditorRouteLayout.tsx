import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { MeetingStatePanel } from "@/features/meetings/editor/MeetingStatePanel";
import {
  AuthorizationError,
  requireBackendUser,
} from "@/lib/auth/authorization";

import { MeetingRouteShell } from "./MeetingRouteShell";

const STANDALONE_MAIN_CLASS =
  "mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12";

export async function MeetingEditorRouteLayout({
  children,
  currentPath,
  loginNextPath,
}: Readonly<{
  children: ReactNode;
  currentPath: string;
  loginNextPath: string;
}>) {
  let context;

  try {
    context = await requireBackendUser();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.code === "UNAUTHENTICATED") {
        redirect(`/login?next=${encodeURIComponent(loginNextPath)}`);
      }

      return (
        <main className={STANDALONE_MAIN_CLASS}>
          <MeetingStatePanel
            description="You do not have permission to access this meeting page."
            state="permission"
            title="Access required"
          />
        </main>
      );
    }

    return (
      <main className={STANDALONE_MAIN_CLASS}>
        <MeetingStatePanel
          description="The meeting workspace could not be prepared. Refresh the page and try again."
          state="system"
          title="Meeting workspace unavailable"
        />
      </main>
    );
  }

  return (
    <MeetingRouteShell
      canManageAccounts={context.canManageAccounts}
      currentPath={currentPath}
      role={context.role}
    >
      {children}
    </MeetingRouteShell>
  );
}
