import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { createServerSupabaseClient } = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

import {
  AuthorizationError,
  requireAccountAdmin,
  requireAuthorised,
  requireBackendUser,
} from "@/lib/auth/authorization";

function configureSupabase(
  role: unknown,
  userId = "fictional-user-id",
  options: Readonly<{
    canManageAccounts?: boolean;
    isActive?: boolean;
  }> = {},
) {
  const maybeSingle = vi.fn(async () =>
    role === null
      ? { data: null, error: null }
      : {
          data: {
            can_manage_accounts: options.canManageAccounts ?? false,
            committee_role: role,
            display_name: "Alex Example",
            is_active: options.isActive ?? true,
          },
          error: null,
        },
  );
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const getUser = vi.fn(async () => ({
    data: { user: { id: userId } },
    error: null,
  }));

  createServerSupabaseClient.mockResolvedValue({
    auth: { getUser },
    from,
  });

  return { eq, from, getUser, maybeSingle, select };
}

beforeEach(() => {
  createServerSupabaseClient.mockReset();
});

describe("requireBackendUser", () => {
  test.each(["committee", "authorised"] as const)(
    "returns the minimum trusted access context for a %s user",
    async (role) => {
      const supabase = configureSupabase(role);

      await expect(requireBackendUser()).resolves.toEqual({
        canManageAccounts: false,
        displayName: "Alex Example",
        role,
        userId: "fictional-user-id",
      });
      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(supabase.eq).toHaveBeenCalledWith("id", "fictional-user-id");
    },
  );

  test("rejects an unauthenticated request before reading a profile", async () => {
    const from = vi.fn();
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      },
      from,
    });

    await expect(requireBackendUser()).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
      message: "Authentication required",
      name: "AuthorizationError",
    });
    expect(from).not.toHaveBeenCalled();
  });

  test.each([null, "participant", "administrator"])(
    "rejects an untrusted or missing profile role: %s",
    async (role) => {
      configureSupabase(role);

      await expect(requireBackendUser()).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Access denied",
        name: "AuthorizationError",
      });
    },
  );

  test("rejects an inactive profile even when its role is valid", async () => {
    configureSupabase("committee", "fictional-user-id", { isActive: false });

    await expect(requireBackendUser()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("requireAuthorised", () => {
  test("returns a trusted authorised context", async () => {
    configureSupabase("authorised");

    await expect(requireAuthorised()).resolves.toEqual({
      canManageAccounts: false,
      displayName: "Alex Example",
      role: "authorised",
      userId: "fictional-user-id",
    });
  });

  test("rejects a committee user", async () => {
    configureSupabase("committee");

    await expect(requireAuthorised()).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    configureSupabase("committee");
    await expect(requireAuthorised()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("requireAccountAdmin", () => {
  test("returns the independently authorised account-management context", async () => {
    configureSupabase("committee", "fictional-user-id", {
      canManageAccounts: true,
    });

    await expect(requireAccountAdmin()).resolves.toEqual({
      canManageAccounts: true,
      displayName: "Alex Example",
      role: "committee",
      userId: "fictional-user-id",
    });
  });

  test("does not treat participant-data access as account administration", async () => {
    configureSupabase("authorised");

    await expect(requireAccountAdmin()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

 test.each(["committee", "authorised"])("denies coordination access to %s Superusers", async role => {
 configureSupabase(role, "fictional-user-id", {canManageAccounts:true});
 await expect(requireBackendUser()).rejects.toMatchObject({code:"FORBIDDEN"});
 await expect(requireAuthorised()).rejects.toMatchObject({code:"FORBIDDEN"});
 });
