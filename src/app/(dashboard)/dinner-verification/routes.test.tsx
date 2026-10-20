import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/app/(auth)/backoffice/logout-form", () => ({ LogoutForm: () => <button>Sign out</button> }));
const mocks = vi.hoisted(() => ({ auth: vi.fn(), list: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/auth/authorization", async (original) => ({ ...await original<typeof import("@/lib/auth/authorization")>(), requireBackendUser: mocks.auth }));
vi.mock("@/features/events/core", () => ({ listEvents: mocks.list }));
vi.mock("@/features/dinner-verification/server", () => ({ readDinnerVerification: mocks.read }));
import { AuthorizationError } from "@/lib/auth/authorization";
import DinnerLayout from "./layout";
import DinnerEventsPage from "./page";
import DinnerEventPage from "./[eventId]/page";
import DinnerLoading from "./loading";
import DinnerError from "./error";
import { refreshDinnerVerification } from "@/features/dinner-verification/actions";

beforeEach(() => { vi.resetAllMocks(); });
describe("D-03 dinner routes", () => {
  it.each(["authorised","committee"])("allows the active %s layout", async role => {
    mocks.auth.mockResolvedValue({ role, canManageAccounts: false, displayName: "Fictional Staff" });
    expect(renderToStaticMarkup(await DinnerLayout({ children: <p>Allowed detail</p> }))).toContain("Allowed detail");
  });
  it("redirects anonymous sessions without rendering children", async () => {
    mocks.auth.mockRejectedValue(new AuthorizationError("UNAUTHENTICATED"));
    await expect(DinnerLayout({ children: <p>Private detail</p> })).rejects.toThrow("REDIRECT:/login");
  });
  it("denies inactive/no-profile sessions at layout and page before event lookup", async () => {
    mocks.auth.mockRejectedValue(new AuthorizationError("FORBIDDEN"));
    expect(renderToStaticMarkup(await DinnerLayout({ children: <p>Private detail</p> }))).not.toContain("Private detail");
    expect(renderToStaticMarkup(await DinnerEventsPage())).toContain('role="alert"');
    expect(mocks.list).not.toHaveBeenCalled();
  });
  it("handles a failed authorisation service safely", async () => {
    mocks.auth.mockRejectedValue(new Error("private diagnostic"));
    const html = renderToStaticMarkup(await DinnerEventsPage());
    expect(html).toContain('role="alert"'); expect(html).not.toContain("private diagnostic");
  });
  it("offers authorised event selection and handles empty events", async () => {
    mocks.auth.mockResolvedValue({ role: "authorised" });
    mocks.list.mockResolvedValueOnce({ ok: true, items: [{ id: "event", name: "Fictional Session", startsAt: "2026-09-28T05:00:00Z" }] }).mockResolvedValueOnce({ ok: true, items: [] });
    expect(renderToStaticMarkup(await DinnerEventsPage())).toContain('/dinner-verification/event');
    expect(renderToStaticMarkup(await DinnerEventsPage())).toContain("No events available");
  });
  it("uses the protected reader for a direct detail request and refresh action", async () => {
    mocks.auth.mockResolvedValue({ role: "authorised", canManageAccounts: false });
    mocks.read.mockResolvedValue({ ok: false, code: "PERMISSION_DENIED" });
    const html = renderToStaticMarkup(await DinnerEventPage({ params: Promise.resolve({ eventId: "private-event" }) }));
    expect(html).toContain('role="alert"');
    expect(mocks.read).toHaveBeenCalledWith("private-event");
    expect(await refreshDinnerVerification("private-event")).toEqual({ ok: false, code: "PERMISSION_DENIED" });
  });
  it("provides non-sensitive loading and retry states", () => {
    expect(renderToStaticMarkup(<DinnerLoading />)).toContain('role="status"');
    expect(renderToStaticMarkup(<DinnerError reset={vi.fn()} />)).toContain("Try again");
  });
});
