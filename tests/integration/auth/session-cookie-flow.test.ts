import type { CookieOptions } from "@supabase/ssr";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const frameworkMocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: frameworkMocks.cookies }));
vi.mock("next/navigation", () => ({ redirect: frameworkMocks.redirect }));

import {
  loginAction,
  logoutAction,
} from "@/app/(auth)/actions";
import { AUTH_ERROR_CODES } from "@/lib/auth/contracts";
import { getAuthenticatedUser } from "@/lib/auth/session";

const FICTIONAL_SUPABASE_URL = "https://fictional-project.supabase.test";
const FICTIONAL_PUBLISHABLE_KEY = "fictional-publishable-key";
const FICTIONAL_EMAIL = "fictional.committee@example.test";

class RequestCookieJar {
  private readonly values = new Map<
    string,
    Readonly<{ options: CookieOptions; value: string }>
  >();

  getAll() {
    return [...this.values].map(([name, cookie]) => ({
      name,
      value: cookie.value,
    }));
  }

  set(name: string, value: string, options: CookieOptions = {}) {
    const expiresAt =
      options.expires instanceof Date
        ? options.expires.getTime()
        : options.expires === undefined
          ? null
          : new Date(options.expires).getTime();
    const isExpired =
      value === "" ||
      options.maxAge === 0 ||
      (expiresAt !== null && expiresAt <= Date.now());

    if (isExpired) {
      this.values.delete(name);
      return;
    }

    this.values.set(name, { options, value });
  }
}

function encodeJwtPart(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function createFictionalJwt(userId: string) {
  const now = Math.floor(Date.now() / 1000);

  return [
    encodeJwtPart({ alg: "HS256", typ: "JWT" }),
    encodeJwtPart({
      aud: "authenticated",
      exp: now + 60 * 60,
      iat: now,
      role: "authenticated",
      sub: userId,
    }),
    encodeJwtPart({ nonce: crypto.randomUUID() }),
  ].join(".");
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    headers: {
      "x-supabase-api-version": "2024-01-01",
    },
    status,
  });
}

function createFictionalAuthService() {
  const userId = crypto.randomUUID();
  const accessToken = createFictionalJwt(userId);
  const refreshToken = crypto.randomUUID();
  const validPassword = crypto.randomUUID();
  const user = {
    app_metadata: { provider: "email", providers: ["email"] },
    aud: "authenticated",
    created_at: new Date(0).toISOString(),
    email: FICTIONAL_EMAIL,
    email_confirmed_at: new Date(0).toISOString(),
    id: userId,
    identities: [],
    is_anonymous: false,
    role: "authenticated",
    updated_at: new Date(0).toISOString(),
    user_metadata: {},
  };
  const requests: string[] = [];

  const fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    requests.push(`${request.method} ${url.pathname}${url.search}`);

    if (
      request.method === "POST" &&
      url.pathname === "/auth/v1/token" &&
      url.searchParams.get("grant_type") === "password"
    ) {
      const credentials = (await request.json()) as Readonly<{
        email?: string;
        password?: string;
      }>;

      if (
        credentials.email !== FICTIONAL_EMAIL ||
        credentials.password !== validPassword
      ) {
        return jsonResponse(
          {
            code: "invalid_credentials",
            message: "Invalid login credentials",
          },
          400,
        );
      }

      return jsonResponse({
        access_token: accessToken,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        expires_in: 60 * 60,
        refresh_token: refreshToken,
        token_type: "bearer",
        user,
      });
    }

    if (request.method === "GET" && url.pathname === "/auth/v1/user") {
      return request.headers.get("authorization") === `Bearer ${accessToken}`
        ? jsonResponse(user)
        : jsonResponse(
            { code: "bad_jwt", message: "Invalid authentication token" },
            401,
          );
    }

    if (request.method === "POST" && url.pathname === "/auth/v1/logout") {
      return request.headers.get("authorization") === `Bearer ${accessToken}`
        ? new Response(null, { status: 204 })
        : jsonResponse(
            { code: "bad_jwt", message: "Invalid authentication token" },
            401,
          );
    }

    return jsonResponse({ message: "Unexpected fictional Auth request" }, 404);
  };

  return { fetch, requests, userId, validPassword };
}

function createLoginSubmission(
  password: string,
  email = FICTIONAL_EMAIL,
) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  formData.set("next", "/dashboard");
  return formData;
}

describe("Supabase SSR session cookie flow", () => {
  const originalEnvironment = {
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = FICTIONAL_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      FICTIONAL_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    if (originalEnvironment.url === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnvironment.url;
    }

    if (originalEnvironment.publishableKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
        originalEnvironment.publishableKey;
    }

    vi.unstubAllGlobals();
  });

  test("X-01 persists authentication across requests and clears it on sign-out", async () => {
    const authService = createFictionalAuthService();
    const cookieJar = new RequestCookieJar();
    frameworkMocks.cookies.mockResolvedValue(cookieJar);
    vi.stubGlobal("fetch", authService.fetch);

    await expect(
      loginAction(
        { error: null },
        createLoginSubmission(authService.validPassword),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(cookieJar.getAll().length).toBeGreaterThan(0);

    await expect(getAuthenticatedUser()).resolves.toEqual({
      ok: true,
      user: { id: authService.userId },
    });

    await expect(logoutAction({ error: null })).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(cookieJar.getAll()).toEqual([]);

    await expect(getAuthenticatedUser()).resolves.toEqual({
      error: AUTH_ERROR_CODES.INVALID_SESSION,
      ok: false,
    });
    expect(authService.requests).toEqual([
      "POST /auth/v1/token?grant_type=password",
      "GET /auth/v1/user",
      "GET /auth/v1/user",
      "POST /auth/v1/logout?scope=local",
    ]);
  });

  test.each(["wrong-password", "unknown-account"] as const)(
    "X-02 %s creates no session cookie",
    async (scenario) => {
      const authService = createFictionalAuthService();
      const cookieJar = new RequestCookieJar();
      frameworkMocks.cookies.mockResolvedValue(cookieJar);
      vi.stubGlobal("fetch", authService.fetch);

      const email =
        scenario === "unknown-account"
          ? "fictional.unknown@example.test"
          : FICTIONAL_EMAIL;
      const password =
        scenario === "wrong-password"
          ? crypto.randomUUID()
          : authService.validPassword;

      await expect(
        loginAction(
          { error: null },
          createLoginSubmission(password, email),
        ),
      ).resolves.toEqual({ error: AUTH_ERROR_CODES.INVALID_CREDENTIALS });
      expect(cookieJar.getAll()).toEqual([]);
      expect(frameworkMocks.redirect).not.toHaveBeenCalled();
    },
  );
});
