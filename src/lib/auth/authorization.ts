import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type BackendRole = "committee" | "authorised";

export type AuthenticatedUser = Readonly<{
  id: string;
}>;

export type AccessContext = Readonly<{
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
  getRoleForUser: (userId: string) => Promise<unknown>;
}>;

function isBackendRole(value: unknown): value is BackendRole {
  return value === "committee" || value === "authorised";
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
    async getRoleForUser(userId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("committee_role")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data.committee_role;
    },
  };
}

async function resolveAccessContext(): Promise<AccessContext> {
  const dependencies = await createDefaultDependencies();
  const user = await dependencies.getAuthenticatedUser();

  if (!user) {
    throw new AuthorizationError("UNAUTHENTICATED");
  }

  const role = await dependencies.getRoleForUser(user.id);

  if (!isBackendRole(role)) {
    throw new AuthorizationError("FORBIDDEN");
  }

  return { userId: user.id, role };
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
