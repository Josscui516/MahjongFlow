import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AccountAuthAdmin } from "./auth-admin";
import type { AccountManagementRepository } from "./repository";
import { createAccountManagementService } from "./service";

const actorId = "22222222-2222-4222-8222-222222222222";
const targetId = "33333333-3333-4333-8333-333333333333";

function authAdmin(
  overrides: Partial<AccountAuthAdmin> = {},
): AccountAuthAdmin {
  return {
    deleteInvitedUser: vi.fn(async () => undefined),
    getUser: vi.fn(async () => ({
      email: "target@example.test",
      emailConfirmedAt: null,
      id: targetId,
      invitedAt: "2026-08-21T00:00:00.000Z",
      lastSignInAt: null,
    })),
    inviteUser: vi.fn(async () => ({
      email: "target@example.test",
      emailConfirmedAt: null,
      id: targetId,
      invitedAt: "2026-08-21T00:00:00.000Z",
      lastSignInAt: null,
    })),
    listUsers: vi.fn(async () => []),
    sendPasswordRecovery: vi.fn(async () => undefined),
    setUserDisabled: vi.fn(async () => undefined),
    ...overrides,
  };
}

function repository(
  overrides: Partial<AccountManagementRepository> = {},
): AccountManagementRepository {
  return {
    createProfile: vi.fn(async () => undefined),
    listProfiles: vi.fn(async () => []),
    recordRecoverySent: vi.fn(async () => undefined),
    setActive: vi.fn(async () => undefined),
    updateProfile: vi.fn(async () => undefined),
    ...overrides,
  };
}

function service(
  auth: AccountAuthAdmin,
  store: AccountManagementRepository,
) {
  return createAccountManagementService({
    authorise: async () => ({
      canManageAccounts: true,
      role: "committee",
      userId: actorId,
    }),
    authAdmin: auth,
    repository: store,
  });
}

describe("account-management service", () => {
  it("creates the Auth invitation before the profile and never accepts a password", async () => {
    const calls: string[] = [];
    const auth = authAdmin({
      inviteUser: vi.fn(async () => {
        calls.push("auth");
        return {
          email: "target@example.test",
          emailConfirmedAt: null,
          id: targetId,
          invitedAt: "2026-08-21T00:00:00.000Z",
          lastSignInAt: null,
        };
      }),
    });
    const store = repository({
      createProfile: vi.fn(async () => {
        calls.push("profile");
      }),
    });

    await service(auth, store).inviteAccount({
      canManageAccounts: false,
      committeePosition: "Events Officer",
      displayName: "Fictional Member",
      email: "target@example.test",
      role: "committee",
    });

    expect(calls).toEqual(["auth", "profile"]);
    expect(auth.inviteUser).toHaveBeenCalledWith(
      "target@example.test",
      "Fictional Member",
    );
  });

  it("compensates an invited Auth user when profile creation fails", async () => {
    const auth = authAdmin();
    const store = repository({
      createProfile: vi.fn(async () => {
        throw new Error("database unavailable");
      }),
    });

    await expect(
      service(auth, store).inviteAccount({
        canManageAccounts: false,
        committeePosition: null,
        displayName: "Fictional Member",
        email: "target@example.test",
        role: "committee",
      }),
    ).rejects.toMatchObject({ code: "SYSTEM_ERROR" });
    expect(auth.deleteInvitedUser).toHaveBeenCalledWith(targetId);
  });

  it("merges server-only Auth email and status into the profile directory", async () => {
    const auth = authAdmin({
      listUsers: vi.fn(async () => [
        {
          email: "target@example.test",
          emailConfirmedAt: null,
          id: targetId,
          invitedAt: "2026-08-21T00:00:00.000Z",
          lastSignInAt: null,
        },
      ]),
    });
    const store = repository({
      listProfiles: vi.fn(async () => [
        {
          canManageAccounts: false,
          committeePosition: null,
          displayName: "Fictional Member",
          id: targetId,
          isActive: true,
          role: "authorised" as const,
        },
      ]),
    });

    await expect(service(auth, store).listAccounts()).resolves.toEqual([
      {
        canManageAccounts: false,
        committeePosition: null,
        displayName: "Fictional Member",
        email: "target@example.test",
        id: targetId,
        isCurrentUser: false,
        role: "authorised",
        status: "invited",
      },
    ]);
  });

  it("restores Auth state if the profile activation update fails", async () => {
    const auth = authAdmin();
    const store = repository({
      setActive: vi.fn(async () => {
        throw new Error("database unavailable");
      }),
    });

    await expect(
      service(auth, store).setAccountActive(targetId, false),
    ).rejects.toMatchObject({ code: "SYSTEM_ERROR" });
    expect(auth.setUserDisabled).toHaveBeenNthCalledWith(1, targetId, true);
    expect(auth.setUserDisabled).toHaveBeenNthCalledWith(2, targetId, false);
  });

  it("records recovery only after the provider accepts the email request", async () => {
    const auth = authAdmin();
    const store = repository();

    await service(auth, store).sendRecovery(targetId);

    expect(auth.sendPasswordRecovery).toHaveBeenCalledWith(
      "target@example.test",
    );
    expect(store.recordRecoverySent).toHaveBeenCalledWith(targetId);
  });
});
