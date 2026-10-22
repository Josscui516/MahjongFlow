import { beforeEach, describe, expect, test, vi } from "vitest";

import { AUTH_ERROR_CODES } from "@/lib/auth/contracts";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  requireActiveUser: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/authorization", () => ({ requireActiveUser: mocks.requireActiveUser }));
vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import { loginAction, logoutAction } from "@/app/(auth)/actions";

function createLoginSubmission(next = "/backoffice") {
  const formData = new FormData();
  formData.set("email", "fictional.committee@example.test");
  formData.set("password", crypto.randomUUID());
  formData.set("next", next);
  return formData;
}

describe("loginAction", () => {
  beforeEach(() => {
    mocks.requireActiveUser.mockResolvedValue({ canManageAccounts: false });
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: {
        signInWithPassword: mocks.signInWithPassword,
        signOut: mocks.signOut,
      },
    });
  });

  test.each(["/dashboard", "/events", "/admin/users"])("redirects Superuser directly to Accounts when next is %s", async next => {
    mocks.signInWithPassword.mockResolvedValue({ data: { session: {}, user: { id: "fictional-admin" } }, error: null });
    mocks.requireActiveUser.mockResolvedValue({ canManageAccounts: true });
    await expect(loginAction({ error: null }, createLoginSubmission(next))).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/users");
  });

  test("keeps a failed access lookup inside the safe error boundary", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { session: {}, user: { id: "fictional-user" } }, error: null });
    mocks.requireActiveUser.mockRejectedValue(new Error("private provider failure"));
    await expect(loginAction({ error: null }, createLoginSubmission())).resolves.toEqual({ error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  test("X-01 redirects a valid login to the approved back-office path", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: {}, user: { id: "fictional-user-id" } },
      error: null,
    });

    await expect(
      loginAction({ error: null }, createLoginSubmission("/backoffice/tasks")),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.signInWithPassword).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/backoffice/tasks");
  });

  test.each([
    { code: "invalid_credentials", status: 400 },
    { code: "user_not_found", status: 404 },
  ])(
    "X-02 returns the same safe error for rejected credentials",
    async (providerError) => {
      mocks.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: providerError,
      });

      await expect(
        loginAction({ error: null }, createLoginSubmission()),
      ).resolves.toEqual({ error: AUTH_ERROR_CODES.INVALID_CREDENTIALS });
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );

  test("returns a safe service error without exposing provider details", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        name: "AuthRetryableFetchError",
        status: 0,
      },
    });

    await expect(
      loginAction({ error: null }, createLoginSubmission()),
    ).resolves.toEqual({ error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE });
  });

  test("rejects an external return target after successful login", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: {}, user: { id: "fictional-user-id" } },
      error: null,
    });

    await expect(
      loginAction(
        { error: null },
        createLoginSubmission("https://malicious.example/backoffice"),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });
});

describe("logoutAction", () => {
  beforeEach(() => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: {
        signInWithPassword: mocks.signInWithPassword,
        signOut: mocks.signOut,
      },
    });
  });

  test("X-01 verifies the user, clears only the current session, and redirects", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      ok: true,
      user: { id: "fictional-user-id" },
    });
    mocks.signOut.mockResolvedValue({ error: null });

    await expect(logoutAction({ error: null })).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  test("does not call the provider when the session is already invalid", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      error: AUTH_ERROR_CODES.INVALID_SESSION,
      ok: false,
    });

    await expect(logoutAction({ error: null })).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  test("returns a safe error when the provider cannot complete sign-out", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      ok: true,
      user: { id: "fictional-user-id" },
    });
    mocks.signOut.mockResolvedValue({
      error: { name: "AuthApiError", status: 503 },
    });

    await expect(logoutAction({ error: null })).resolves.toEqual({
      error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
