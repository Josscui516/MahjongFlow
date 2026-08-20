import type { ReactNode } from "react";

import { LogoutForm } from "@/app/(auth)/backoffice/logout-form";
import { BackofficeShell } from "@/components/layout/BackofficeShell";
import type { BackendRole } from "@/lib/auth/authorization";

export function MeetingRouteShell({
  children,
  currentPath,
  role,
}: Readonly<{
  children: ReactNode;
  currentPath: string;
  role: BackendRole;
}>) {
  return (
    <BackofficeShell
      accountSlot={<span>Signed in</span>}
      currentPath={currentPath}
      role={role}
      signOutSlot={<LogoutForm />}
    >
      {children}
    </BackofficeShell>
  );
}
