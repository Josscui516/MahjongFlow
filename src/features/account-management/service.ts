import "server-only";

import {
  requireAccountAdmin,
  type AccessContext,
} from "@/lib/auth/authorization";

import {
  AccountAuthAdminError,
  createAccountAuthAdmin,
  type AccountAuthAdmin,
} from "./auth-admin";
import type {
  InviteAccountInput,
  ManagedAccount,
  ManagedAccountStatus,
  UpdateAccountInput,
} from "./contracts";
import {
  AccountRepositoryError,
  createAccountManagementRepository,
  type AccountManagementRepository,
} from "./repository";

export type AccountManagementErrorCode =
  | "CONFLICT"
  | "DUPLICATE_EMAIL"
  | "FORBIDDEN"
  | "MISSING"
  | "SYSTEM_ERROR";

export class AccountManagementError extends Error {
  readonly code: AccountManagementErrorCode;

  constructor(code: AccountManagementErrorCode) {
    super(code);
    this.name = "AccountManagementError";
    this.code = code;
  }
}

type AccountManagementDependencies = Readonly<{
  authorise: () => Promise<AccessContext & Readonly<{ canManageAccounts: true }>>;
  authAdmin: AccountAuthAdmin;
  repository: AccountManagementRepository;
}>;

function mapServiceError(error: unknown): AccountManagementError {
  if (error instanceof AccountManagementError) {
    return error;
  }

  if (error instanceof AccountRepositoryError) {
    return new AccountManagementError(error.code);
  }

  if (error instanceof AccountAuthAdminError) {
    if (error.code === "DUPLICATE_EMAIL") {
      return new AccountManagementError("DUPLICATE_EMAIL");
    }

    if (error.code === "MISSING_USER") {
      return new AccountManagementError("MISSING");
    }
  }

  return new AccountManagementError("SYSTEM_ERROR");
}

function resolveStatus(
  isActive: boolean,
  emailConfirmedAt: string | null,
  lastSignInAt: string | null,
): ManagedAccountStatus {
  if (!isActive) {
    return "disabled";
  }

  return emailConfirmedAt || lastSignInAt ? "active" : "invited";
}

export function createAccountManagementService(
  dependencies: AccountManagementDependencies,
) {
  return {
    async inviteAccount(input: InviteAccountInput) {
      await dependencies.authorise();
      let invitedUserId: string | null = null;

      try {
        const user = await dependencies.authAdmin.inviteUser(
          input.email,
          input.displayName,
        );
        invitedUserId = user.id;
        await dependencies.repository.createProfile({
          canManageAccounts: input.canManageAccounts,
          committeePosition: input.committeePosition,
          displayName: input.displayName,
          id: user.id,
          isActive: true,
          role: input.role,
        });
      } catch (error) {
        if (invitedUserId) {
          try {
            await dependencies.authAdmin.deleteInvitedUser(invitedUserId);
          } catch {
            // The primary error remains authoritative. An orphaned Auth user is
            // denied because it has no active profile and can be reconciled safely.
          }
        }

        throw mapServiceError(error);
      }
    },
    async listAccounts(): Promise<readonly ManagedAccount[]> {
      const context = await dependencies.authorise();

      try {
        const [profiles, authUsers] = await Promise.all([
          dependencies.repository.listProfiles(),
          dependencies.authAdmin.listUsers(),
        ]);
        const authById = new Map(authUsers.map((user) => [user.id, user]));

        return profiles.map((profile) => {
          const authUser = authById.get(profile.id);

          return {
            canManageAccounts: profile.canManageAccounts,
            committeePosition: profile.committeePosition,
            displayName: profile.displayName,
            email: authUser?.email || "Email unavailable",
            id: profile.id,
            isCurrentUser: profile.id === context.userId,
            role: profile.role,
            status: resolveStatus(
              profile.isActive,
              authUser?.emailConfirmedAt ?? null,
              authUser?.lastSignInAt ?? null,
            ),
          };
        });
      } catch (error) {
        throw mapServiceError(error);
      }
    },
    async sendRecovery(id: string) {
      await dependencies.authorise();

      try {
        const user = await dependencies.authAdmin.getUser(id);

        if (!user.email) {
          throw new AccountManagementError("MISSING");
        }

        await dependencies.authAdmin.sendPasswordRecovery(user.email);
        await dependencies.repository.recordRecoverySent(id);
      } catch (error) {
        throw mapServiceError(error);
      }
    },
    async setAccountActive(id: string, isActive: boolean) {
      await dependencies.authorise();

      try {
        await dependencies.authAdmin.setUserDisabled(id, !isActive);

        try {
          await dependencies.repository.setActive(id, isActive);
        } catch (error) {
          await dependencies.authAdmin.setUserDisabled(id, isActive);
          throw error;
        }
      } catch (error) {
        throw mapServiceError(error);
      }
    },
    async updateAccount(input: UpdateAccountInput) {
      await dependencies.authorise();

      try {
        await dependencies.repository.updateProfile({
          ...input,
          isActive: true,
        });
      } catch (error) {
        throw mapServiceError(error);
      }
    },
  };
}

export async function getAccountManagementService() {
  return createAccountManagementService({
    authorise: requireAccountAdmin,
    authAdmin: createAccountAuthAdmin(),
    repository: await createAccountManagementRepository(),
  });
}
