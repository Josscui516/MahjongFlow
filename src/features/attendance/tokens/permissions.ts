import type { AccessContext } from "@/lib/auth/authorization";

export function canManageEventQr(access: Pick<AccessContext, "role" | "canManageAccounts">): boolean {
  return access.role === "authorised" || access.canManageAccounts === true;
}
