import type { ReactNode } from "react";

import { AppNavigation } from "./AppNavigation";
import type { BackofficeRole } from "./navigation";

export type BackofficeShellProps = Readonly<{
  accountSlot?: ReactNode;
  canManageAccounts?: boolean;
  children: ReactNode;
  currentPath?: string;
  role: BackofficeRole;
  signOutSlot: ReactNode;
}>;

const ROLE_LABELS: Readonly<Record<BackofficeRole, string>> = {
  authorised: "Authorised",
  committee: "Committee",
};

/**
 * Shared presentation shell for protected routes.
 *
 * The caller must obtain `role` from the trusted server-side authorisation
 * boundary before rendering this component. Hiding a navigation item here does
 * not replace route protection or database RLS.
 */
export function BackofficeShell({
  accountSlot,
  canManageAccounts,
  children,
  currentPath,
  role,
  signOutSlot,
}: BackofficeShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
        href="#main-content"
      >
        Skip to main content
      </a>

      <AppNavigation
        accountSlot={<><p className="text-xs font-medium text-slate-600">Role: {ROLE_LABELS[role]}</p>{accountSlot}{signOutSlot}</>}
        canManageAccounts={canManageAccounts}
        currentPath={currentPath}
        role={role}
      />

      <div className="md:pl-72">
        <header className="hidden border-b border-slate-200 bg-white px-4 py-3 md:block sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-x-4 gap-y-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-inset ring-emerald-200">
              Role: {ROLE_LABELS[role]}
            </span>
            {accountSlot ? (
              <div className="text-sm text-slate-600">{accountSlot}</div>
            ) : null}
            <div>{signOutSlot}</div>
          </div>
        </header>

        <main
          className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-10"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
