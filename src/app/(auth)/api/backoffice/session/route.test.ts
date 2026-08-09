import { beforeEach, describe, expect, test, vi } from "vitest";

import { AUTH_ERROR_CODES } from "@/lib/auth/contracts";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

import { GET } from "@/app/(auth)/api/backoffice/session/route";

describe("GET /api/backoffice/session", () => {
  beforeEach(() => {
    mocks.getAuthenticatedUser.mockReset();
  });

  test("X-03 rejects a direct anonymous request without back-office data", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      error: AUTH_ERROR_CODES.INVALID_SESSION,
      ok: false,
    });

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: AUTH_ERROR_CODES.INVALID_SESSION,
    });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  test("returns a fixed service error without provider details", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
      ok: false,
    });

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
    });
  });

  test("returns only the minimum success DTO", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      ok: true,
      user: { id: "fictional-user-id" },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ authenticated: true });
  });
});
