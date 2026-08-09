import {
  unstable_doesMiddlewareMatch as doesProxyMatch,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AUTH_ERROR_CODES } from "@/lib/auth/contracts";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));
vi.mock("@/lib/supabase/env", () => ({
  getSupabasePublicEnvironment: () => ({
    publishableKey: "fictional-publishable-key",
    url: "https://fictional-project.supabase.test",
  }),
}));

import { config, proxy } from "@/proxy";

type ServerClientOptions = Readonly<{
  cookies: Readonly<{
    getAll: () => unknown;
    setAll: (
      cookies: ReadonlyArray<{
        name: string;
        options: Readonly<{ httpOnly?: boolean; path?: string }>;
        value: string;
      }>,
      headers: Readonly<Record<string, string>>,
    ) => void;
  }>;
}>;

describe("authentication proxy", () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.createServerClient.mockImplementation(
      (_url: string, _key: string, options: ServerClientOptions) => ({
        auth: { getUser: mocks.getUser },
        testCookieAdapter: options.cookies,
      }),
    );
  });

  test.each([
    ["/backoffice", true],
    ["/backoffice/tasks", true],
    ["/api/backoffice/session", true],
    ["/login", false],
    ["/api/health/supabase", false],
  ])("matches only protected routes", (url, expected) => {
    expect(
      doesProxyMatch({
        config,
        nextConfig: {},
        url,
      }),
    ).toBe(expected);
  });

  test("X-03 redirects an anonymous page request to the constrained login path", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError", status: 400 },
    });

    const response = await proxy(
      new NextRequest("https://mahjongflow.test/backoffice/tasks?filter=mine"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://mahjongflow.test/login?next=%2Fbackoffice%2Ftasks%3Ffilter%3Dmine",
    );
  });

  test("X-03 denies an anonymous direct API request with no protected data", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError", status: 400 },
    });

    const response = await proxy(
      new NextRequest("https://mahjongflow.test/api/backoffice/session"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: AUTH_ERROR_CODES.INVALID_SESSION,
    });
  });

  test("X-01 preserves a refreshed session response for an authenticated request", async () => {
    mocks.getUser.mockImplementation(async () => {
      const client = mocks.createServerClient.mock.results.at(-1)?.value as {
        testCookieAdapter: ServerClientOptions["cookies"];
      };

      client.testCookieAdapter.setAll(
        [
          {
            name: "sb-auth-session",
            options: { httpOnly: true, path: "/" },
            value: crypto.randomUUID(),
          },
        ],
        {
          "Cache-Control":
            "private, no-cache, no-store, must-revalidate, max-age=0",
          Expires: "0",
          Pragma: "no-cache",
        },
      );

      return {
        data: { user: { id: "fictional-user-id" } },
        error: null,
      };
    });

    const response = await proxy(
      new NextRequest("https://mahjongflow.test/backoffice"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.has("set-cookie")).toBe(true);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  test("returns a fixed service failure instead of exposing provider details", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthApiError", status: 503 },
    });

    const response = await proxy(
      new NextRequest("https://mahjongflow.test/api/backoffice/session"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
    });
  });
});
