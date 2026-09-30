import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ authentication: vi.fn(), access: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getAuthenticatedUser: mocks.authentication }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/app/(auth)/login/login-form", () => ({ LoginForm: () => <form>Switch account</form> }));
vi.mock("@/lib/auth/authorization", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/authorization")>("@/lib/auth/authorization");
  return { ...actual, requireBackendUser: mocks.access };
});
import LoginPage from "./page";
import { AuthorizationError } from "@/lib/auth/authorization";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authentication.mockResolvedValue({ ok: true, user: { id: "fictional-user" } });
  mocks.redirect.mockImplementation(() => { throw new Error("redirect"); });
});
test("an authenticated user without active profile can switch accounts instead of looping", async () => {
  mocks.access.mockRejectedValue(new AuthorizationError("FORBIDDEN"));
  const html = renderToStaticMarkup(await LoginPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("Switch account");
  expect(mocks.redirect).not.toHaveBeenCalled();
});
test("an active backend account retains the safe post-login redirect", async () => {
  mocks.access.mockResolvedValue({ role: "committee" });
  await expect(LoginPage({ searchParams: Promise.resolve({ next: "/events" }) })).rejects.toThrow("redirect");
  expect(mocks.redirect).toHaveBeenCalledWith("/events");
});
