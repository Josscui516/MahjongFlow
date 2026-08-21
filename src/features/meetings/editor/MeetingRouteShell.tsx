import type { ReactNode } from "react";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { BackofficeShell } from "@/components/layout/BackofficeShell";
import type { BackendRole } from "@/lib/auth/authorization";

export function MeetingRouteShell({
  canManageAccounts,
  children,
  currentPath,
  displayName,
  role,
}: Readonly<{
  canManageAccounts?: boolean;
  children: ReactNode;
  currentPath: string;
  displayName?: string;
  role: BackendRole;
}>) {
  return (
    <BackofficeShell
      accountSlot={
        <span className="font-medium text-slate-700">
          {displayName?.trim() || "Committee member"}
        </span>
      }
      canManageAccounts={canManageAccounts}
      currentPath={currentPath}
      role={role}
      signOutSlot={<LogoutForm />}
    >
      {children}
    </BackofficeShell>
  );
}
