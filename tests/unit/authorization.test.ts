import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  AuthorizationError,
  requireAuthorised,
  requireBackendUser,
} from "@/lib/auth/authorization";

function createDependencies(role: unknown, userId = "fictional-user-id") {
  return {
    getAuthenticatedUser: vi.fn(async () => ({ id: userId })),
    getRoleForUser: vi.fn(async () => role),
  };
}

describe("requireBackendUser", () => {
  test.each(["committee", "authorised"] as const)(
    "returns the minimum trusted access context for a %s user",
    async (role) => {
      const dependencies = createDependencies(role);

      await expect(requireBackendUser(dependencies)).resolves.toEqual({
        role,
        userId: "fictional-user-id",
      });
      expect(dependencies.getRoleForUser).toHaveBeenCalledWith(
        "fictional-user-id",
      );
    },
  );

  test("rejects an unauthenticated request before reading a profile", async () => {
    const dependencies = {
      getAuthenticatedUser: vi.fn(async () => null),
      getRoleForUser: vi.fn(async () => "authorised"),
    };

    await expect(requireBackendUser(dependencies)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
      message: "Authentication required",
      name: "AuthorizationError",
    });
    expect(dependencies.getRoleForUser).not.toHaveBeenCalled();
  });

  test.each([null, "participant", "administrator"])(
    "rejects an untrusted or missing profile role: %s",
    async (role) => {
      const dependencies = createDependencies(role);

      await expect(requireBackendUser(dependencies)).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Access denied",
        name: "AuthorizationError",
      });
    },
  );
});

describe("requireAuthorised", () => {
  test("returns a trusted authorised context", async () => {
    const dependencies = createDependencies("authorised");

    await expect(requireAuthorised(dependencies)).resolves.toEqual({
      role: "authorised",
      userId: "fictional-user-id",
    });
  });

  test("rejects a committee user", async () => {
    const dependencies = createDependencies("committee");

    await expect(requireAuthorised(dependencies)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    await expect(requireAuthorised(dependencies)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
