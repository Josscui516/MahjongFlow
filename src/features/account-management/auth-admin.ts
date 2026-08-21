import "server-only";

import { createClient, type User } from "@supabase/supabase-js";

import { getSupabaseAdminEnvironment } from "@/lib/supabase/env";

export type AccountAuthUser = Readonly<{
  email: string;
  emailConfirmedAt: string | null;
  id: string;
  invitedAt: string | null;
  lastSignInAt: string | null;
}>;

export type AccountAuthAdminErrorCode =
  | "DUPLICATE_EMAIL"
  | "MISSING_USER"
  | "SYSTEM_ERROR";

export class AccountAuthAdminError extends Error {
  readonly code: AccountAuthAdminErrorCode;

  constructor(code: AccountAuthAdminErrorCode) {
    super(code);
    this.name = "AccountAuthAdminError";
    this.code = code;
  }
}

export type AccountAuthAdmin = Readonly<{
  deleteInvitedUser: (id: string) => Promise<void>;
  getUser: (id: string) => Promise<AccountAuthUser>;
  inviteUser: (
    email: string,
    displayName: string,
  ) => Promise<AccountAuthUser>;
  listUsers: () => Promise<readonly AccountAuthUser[]>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  setUserDisabled: (id: string, disabled: boolean) => Promise<void>;
}>;

function mapUser(user: User): AccountAuthUser {
  return {
    email: user.email ?? "",
    emailConfirmedAt: user.email_confirmed_at ?? null,
    id: user.id,
    invitedAt: user.invited_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

function mapAuthError(error: Readonly<{ code?: string; message?: string }>) {
  if (
    error.code === "user_not_found" ||
    error.message?.toLowerCase().includes("user not found")
  ) {
    return new AccountAuthAdminError("MISSING_USER");
  }

  const duplicateCodes = new Set([
    "email_exists",
    "user_already_exists",
    "email_address_not_authorized",
  ]);

  if (
    (error.code && duplicateCodes.has(error.code)) ||
    error.message?.toLowerCase().includes("already")
  ) {
    return new AccountAuthAdminError("DUPLICATE_EMAIL");
  }

  return new AccountAuthAdminError("SYSTEM_ERROR");
}

export function createAccountAuthAdmin(): AccountAuthAdmin {
  const { applicationUrl, secretKey, url } = getSupabaseAdminEnvironment();
  const client = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const passwordRedirect = `${applicationUrl}/account/password`;

  return {
    async deleteInvitedUser(id) {
      const { error } = await client.auth.admin.deleteUser(id);

      if (error) {
        throw mapAuthError(error);
      }
    },
    async getUser(id) {
      const { data, error } = await client.auth.admin.getUserById(id);

      if (error) {
        throw mapAuthError(error);
      }

      if (!data.user) {
        throw new AccountAuthAdminError("MISSING_USER");
      }

      return mapUser(data.user);
    },
    async inviteUser(email, displayName) {
      const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
        data: { display_name: displayName },
        redirectTo: passwordRedirect,
      });

      if (error) {
        throw mapAuthError(error);
      }

      if (!data.user) {
        throw new AccountAuthAdminError("SYSTEM_ERROR");
      }

      return mapUser(data.user);
    },
    async listUsers() {
      const users: AccountAuthUser[] = [];
      let page = 1;

      while (true) {
        const { data, error } = await client.auth.admin.listUsers({
          page,
          perPage: 200,
        });

        if (error) {
          throw mapAuthError(error);
        }

        users.push(...data.users.map(mapUser));

        if (!data.nextPage) {
          break;
        }

        page = data.nextPage;
      }

      return users;
    },
    async sendPasswordRecovery(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: passwordRedirect,
      });

      if (error) {
        throw mapAuthError(error);
      }
    },
    async setUserDisabled(id, disabled) {
      const { error } = await client.auth.admin.updateUserById(id, {
        ban_duration: disabled ? "876000h" : "none",
      });

      if (error) {
        throw mapAuthError(error);
      }
    },
  };
}
