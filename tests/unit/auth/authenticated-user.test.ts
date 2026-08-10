import { describe, expect, test, vi } from "vitest";

import { resolveAuthenticatedUser } from "@/lib/auth/authenticated-user";
import { AUTH_ERROR_CODES } from "@/lib/auth/contracts";

describe("resolveAuthenticatedUser", () => {
  test("returns only the trusted user ID for a valid session", async () => {
    const lookupUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          email: "fictional.committee@example.test",
          id: "fictional-user-id",
        },
      },
      error: null,
    });

    await expect(resolveAuthenticatedUser(lookupUser)).resolves.toEqual({
      ok: true,
      user: { id: "fictional-user-id" },
    });
    expect(lookupUser).toHaveBeenCalledOnce();
  });

  test("returns the unified invalid-session result when no user exists", async () => {
    const lookupUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(resolveAuthenticatedUser(lookupUser)).resolves.toEqual({
      error: AUTH_ERROR_CODES.INVALID_SESSION,
      ok: false,
    });
  });

  test.each([
    { name: "AuthSessionMissingError", status: 400 },
    { code: "session_expired", status: 400 },
    { code: "session_not_found", status: 404 },
    { code: "user_not_found", status: 404 },
    { code: "bad_jwt", status: 401 },
  ])("maps missing and invalid sessions to one safe result", async (error) => {
    const lookupUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error,
    });

    await expect(resolveAuthenticatedUser(lookupUser)).resolves.toEqual({
      error: AUTH_ERROR_CODES.INVALID_SESSION,
      ok: false,
    });
  });

  test("maps an authentication service error to a safe service result", async () => {
    const lookupUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { name: "AuthApiError", status: 503 },
    });

    await expect(resolveAuthenticatedUser(lookupUser)).resolves.toEqual({
      error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
      ok: false,
    });
  });

  test("does not expose exceptions thrown by the authentication provider", async () => {
    const lookupUser = vi
      .fn()
      .mockRejectedValue(new Error("fictional provider detail"));

    await expect(resolveAuthenticatedUser(lookupUser)).resolves.toEqual({
      error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
      ok: false,
    });
  });
});
