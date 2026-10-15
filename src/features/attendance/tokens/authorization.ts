import "server-only";
import { AuthorizationError, requireBackendUser } from "@/lib/auth/authorization";
import { canManageEventQr } from "./permissions";

export async function requireQrManager() {
  const access = await requireBackendUser();
  if (!canManageEventQr(access)) throw new AuthorizationError("FORBIDDEN");
  return access;
}
