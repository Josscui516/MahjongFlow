import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type BackendRole = "committee" | "authorised";

export type AuthenticatedUser = Readonly<{
  id: string;
}>;

export type AccessContext = Readonly<{
  canManageAccounts: boolean;
  displayName?: string;
  userId: string;
  role: BackendRole;
}>;

export type AuthorizationErrorCode = "UNAUTHENTICATED" | "FORBIDDEN";

export class AuthorizationError extends Error {
  readonly code: AuthorizationErrorCode;

  constructor(code: AuthorizationErrorCode) {
    super(code === "UNAUTHENTICATED" ? "Authentication required" : "Access denied");
    this.name = "AuthorizationError";
    this.code = code;
  }
}

type AuthorizationDependencies = Readonly<{
  getAuthenticatedUser: () => Promise<AuthenticatedUser | null>;
  getProfileAccessForUser: (userId: string) => Promise<unknown>;
}>;

type ProfileAccess = Readonly<{
  canManageAccounts: boolean;
  displayName: string;
  isActive: boolean;
  role: BackendRole;
}>;

function isBackendRole(value: unknown): value is BackendRole {
  return value === "committee" || value === "authorised";
}

function isProfileAccess(value: unknown): value is ProfileAccess {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isBackendRole(candidate.role) &&
    typeof candidate.canManageAccounts === "boolean" &&
    typeof candidate.displayName === "string" &&
    typeof candidate.isActive === "boolean"
  );
}

async function createDefaultDependencies(): Promise<AuthorizationDependencies> {
  const supabase = await createServerSupabaseClient();

  return {
    async getAuthenticatedUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return { id: user.id };
    },
    async getProfileAccessForUser(userId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("committee_role, can_manage_accounts, display_name, is_active")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        canManageAccounts: data.can_manage_accounts,
        displayName: data.display_name,
        isActive: data.is_active,
        role: data.committee_role,
      };
    },
  };
}

async function resolveAccessContext(): Promise<AccessContext> {
  const dependencies = await createDefaultDependencies();
  const user = await dependencies.getAuthenticatedUser();

  if (!user) {
    throw new AuthorizationError("UNAUTHENTICATED");
  }

  const profileAccess = await dependencies.getProfileAccessForUser(user.id);

  if (!isProfileAccess(profileAccess) || !profileAccess.isActive) {
    throw new AuthorizationError("FORBIDDEN");
  }

  return {
    canManageAccounts: profileAccess.canManageAccounts,
    displayName: profileAccess.displayName,
    userId: user.id,
    role: profileAccess.role,
  };
}

export async function requireBackendUser(): Promise<AccessContext> {
  return resolveAccessContext();
}

export async function requireAuthorised(): Promise<
  AccessContext & Readonly<{ role: "authorised" }>
> {
  const context = await resolveAccessContext();

  if (context.role !== "authorised") {
    throw new AuthorizationError("FORBIDDEN");
  }

  return { ...context, role: "authorised" };
}

export async function requireAccountAdmin(): Promise<
  AccessContext & Readonly<{ canManageAccounts: true }>
> {
  const context = await resolveAccessContext();

  if (!context.canManageAccounts) {
    throw new AuthorizationError("FORBIDDEN");
  }

  return { ...context, canManageAccounts: true };
}
