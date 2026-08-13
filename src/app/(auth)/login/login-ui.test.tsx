import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const authMocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => authMocks);

vi.mock("@/app/(auth)/login/login-form", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/app/(auth)/login/login-form")
  >();

  return {
    ...actual,
    LoginForm: ({ nextPath }: Readonly<{ nextPath: string }>) => (
      <actual.LoginFormView
        error={null}
        formAction="/fictional-login"
        nextPath={nextPath}
        pending={false}
      />
    ),
  };
});

import { LoginFormView } from "@/app/(auth)/login/login-form";
import LoginPage from "@/app/(auth)/login/page";
import { AUTH_ERROR_CODES } from "@/lib/auth/contracts";

describe("integrated login UI", () => {
  test("composes the shared login shell and shared form controls", async () => {
    authMocks.getAuthenticatedUser.mockResolvedValue({
      error: AUTH_ERROR_CODES.INVALID_SESSION,
      ok: false,
    });

    const html = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({}) }),
    );

    expect(html).toContain("Committee coordination");
    expect(html).toContain("Back-office sign in");
    expect(html).toContain("bg-emerald-950");
    expect(html).toContain('id="email"');
    expect(html).toContain('id="password"');
    expect(html).toContain('data-submit-state="idle"');
  });

  test("renders safe shared authentication feedback", () => {
    const html = renderToStaticMarkup(
      <LoginFormView
        error={AUTH_ERROR_CODES.INVALID_CREDENTIALS}
        formAction="/fictional-login"
        nextPath="/backoffice"
        pending={false}
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Authentication error");
    expect(html).toContain("Check your sign-in details and try again.");
    expect(html).not.toContain("unknown account");
  });

  test("uses the shared pending submit state", () => {
    const html = renderToStaticMarkup(
      <LoginFormView
        error={null}
        formAction="/fictional-login"
        nextPath="/backoffice"
        pending
      />,
    );

    expect(html).toContain('data-submit-state="pending"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain("Signing in…");
  });
});
