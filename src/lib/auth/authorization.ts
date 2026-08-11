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

async function resolveAccessContext(
  dependencies?: AuthorizationDependencies,
): Promise<AccessContext> {
  const resolvedDependencies =
    dependencies ?? (await createDefaultDependencies());
  const user = await resolvedDependencies.getAuthenticatedUser();

  if (!user) {
    throw new AuthorizationError("UNAUTHENTICATED");
  }

  const role = await resolvedDependencies.getRoleForUser(user.id);

  if (!isBackendRole(role)) {
    throw new AuthorizationError("FORBIDDEN");
  }

  return { userId: user.id, role };
}

export async function requireBackendUser(
  dependencies?: AuthorizationDependencies,
): Promise<AccessContext> {
  return resolveAccessContext(dependencies);
}

export async function requireAuthorised(
  dependencies?: AuthorizationDependencies,
): Promise<AccessContext & Readonly<{ role: "authorised" }>> {
  const context = await resolveAccessContext(dependencies);

  if (context.role !== "authorised") {
    throw new AuthorizationError("FORBIDDEN");
  }

  return { ...context, role: "authorised" };
}
