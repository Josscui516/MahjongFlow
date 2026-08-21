import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BackendRole } from "@/lib/auth/authorization";

export type ManagedProfile = Readonly<{
  canManageAccounts: boolean;
  committeePosition: string | null;
  displayName: string;
  id: string;
  isActive: boolean;
  role: BackendRole;
}>;

export type AccountManagementRepository = Readonly<{
  createProfile: (profile: ManagedProfile) => Promise<void>;
  listProfiles: () => Promise<readonly ManagedProfile[]>;
  recordRecoverySent: (id: string) => Promise<void>;
  setActive: (id: string, isActive: boolean) => Promise<void>;
  updateProfile: (profile: ManagedProfile) => Promise<void>;
}>;

export type AccountRepositoryErrorCode =
  | "CONFLICT"
  | "FORBIDDEN"
  | "MISSING"
  | "SYSTEM_ERROR";

export class AccountRepositoryError extends Error {
  readonly code: AccountRepositoryErrorCode;

  constructor(code: AccountRepositoryErrorCode) {
    super(code);
    this.name = "AccountRepositoryError";
    this.code = code;
  }
}

function mapRepositoryError(error: Readonly<{ code?: string }>) {
  if (error.code === "42501") {
    return new AccountRepositoryError("FORBIDDEN");
  }

  if (error.code === "23514" || error.code === "23505") {
    return new AccountRepositoryError("CONFLICT");
  }

  if (error.code === "P0002") {
    return new AccountRepositoryError("MISSING");
  }

  return new AccountRepositoryError("SYSTEM_ERROR");
}

export async function createAccountManagementRepository(): Promise<AccountManagementRepository> {
  const supabase = await createServerSupabaseClient();

  return {
    async createProfile(profile) {
      const { error } = await supabase.rpc("create_managed_profile", {
        target_can_manage_accounts: profile.canManageAccounts,
        target_committee_position: profile.committeePosition,
        target_display_name: profile.displayName,
        target_profile_id: profile.id,
        target_role: profile.role,
      });

      if (error) {
        throw mapRepositoryError(error);
      }
    },
    async listProfiles() {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, display_name, committee_role, committee_position, can_manage_accounts, is_active",
        )
        .order("display_name")
        .order("id");

      if (error) {
        throw mapRepositoryError(error);
      }

      return data.map((profile) => ({
        canManageAccounts: profile.can_manage_accounts,
        committeePosition: profile.committee_position,
        displayName: profile.display_name,
        id: profile.id,
        isActive: profile.is_active,
        role: profile.committee_role,
      }));
    },
    async recordRecoverySent(id) {
      const { error } = await supabase.rpc("record_account_recovery_sent", {
        target_profile_id: id,
      });

      if (error) {
        throw mapRepositoryError(error);
      }
    },
    async setActive(id, isActive) {
      const { error } = await supabase.rpc("set_managed_profile_active", {
        target_is_active: isActive,
        target_profile_id: id,
      });

      if (error) {
        throw mapRepositoryError(error);
      }
    },
    async updateProfile(profile) {
      const { error } = await supabase.rpc("update_managed_profile", {
        target_can_manage_accounts: profile.canManageAccounts,
        target_committee_position: profile.committeePosition,
        target_display_name: profile.displayName,
        target_profile_id: profile.id,
        target_role: profile.role,
      });

      if (error) {
        throw mapRepositoryError(error);
      }
    },
  };
}
