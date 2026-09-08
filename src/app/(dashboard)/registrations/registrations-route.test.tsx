import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ list: vi.fn(), count: vi.fn(), redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`); }) }));
vi.mock("@/features/registrations/records/service", () => ({ registrationService: mocks }));
vi.mock("@/features/registrations/records/actions", () => ({ changeRegistrationStatus: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, useRouter: () => ({ refresh: vi.fn() }) }));
import Page from "./[eventId]/page";
const params = Promise.resolve({ eventId: "27000000-0000-4000-8000-000000000001" });
describe("registration route access boundary", () => {
  beforeEach(() => vi.clearAllMocks());
  it("redirects anonymous sessions without reading counts", async () => {
    mocks.list.mockResolvedValue({ ok: false, code: "UNAUTHENTICATED" });
    await expect(Page({ params, searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/login");
    expect(mocks.count).not.toHaveBeenCalled();
  });
  it("shows safe denial with no roster for committee/participant sessions", async () => {
    mocks.list.mockResolvedValue({ ok: false, code: "PERMISSION_DENIED" });
    const html = renderToStaticMarkup(await Page({ params, searchParams: Promise.resolve({}) }));
    expect(html).toContain("do not have permission"); expect(mocks.count).not.toHaveBeenCalled();
  });
  it("passes invalid repeated page parameters to explicit validation", async () => {
    mocks.list.mockResolvedValue({ ok: false, code: "VALIDATION" });
    await Page({ params, searchParams: Promise.resolve({ page: ["1", "2"] }) });
    expect(mocks.list).toHaveBeenCalledWith((await params).eventId, NaN);
  });
});
