import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/authorization",async original=>({...await original<typeof import("@/lib/auth/authorization")>(),requireBackendUser:mocks.access}));
vi.mock("@/features/registrations/records/member-submission-action",()=>({submitMemberListChange:vi.fn()}));
vi.mock("@/features/events/core/service", () => ({ getEvent: mocks.event }));
vi.mock("@/features/registrations/attendance-summary/service", () => ({ participationSummaryService: { get: mocks.summary } }));
const mocks = vi.hoisted(() => ({ access:vi.fn(),list: vi.fn(), count: vi.fn(), summary: vi.fn(), event: vi.fn(), redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`); }) }));
vi.mock("@/features/registrations/records/service", () => ({ registrationService: mocks }));
vi.mock("@/features/registrations/records/actions", () => ({ changeRegistrationStatus: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, useRouter: () => ({ refresh: vi.fn() }) }));
import Page from "./[eventId]/page";
const params = Promise.resolve({ eventId: "27000000-0000-4000-8000-000000000001" });
describe("registration route access boundary", () => {
  beforeEach(() => {vi.clearAllMocks();mocks.access.mockResolvedValue({role:"authorised"});});
  it("gives committee a write-only form without reading existing registrations",async()=>{
    mocks.access.mockResolvedValue({role:"committee"});
    mocks.event.mockResolvedValue({ok:true,record:{name:"Fictional event",requiresStudentId:false}});
    const html=renderToStaticMarkup(await Page({params,searchParams:Promise.resolve({})}));
    expect(html).toContain("Submit registration changes");
    expect(html).not.toContain("Registration records");
    expect(mocks.list).not.toHaveBeenCalled();expect(mocks.summary).not.toHaveBeenCalled();
  });
  it("redirects anonymous sessions without reading counts", async () => {
    mocks.list.mockResolvedValue({ ok: false, code: "UNAUTHENTICATED" });
    await expect(Page({ params, searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/login");
    expect(mocks.summary).not.toHaveBeenCalled();
  });
  it("shows safe denial with no roster for committee/participant sessions", async () => {
    mocks.list.mockResolvedValue({ ok: false, code: "PERMISSION_DENIED" });
    const html = renderToStaticMarkup(await Page({ params, searchParams: Promise.resolve({}) }));
    expect(html).toContain("do not have permission"); expect(mocks.summary).not.toHaveBeenCalled();
  });
  it("passes invalid repeated page parameters to explicit validation", async () => {
    mocks.list.mockResolvedValue({ ok: false, code: "VALIDATION" });
    await Page({ params, searchParams: Promise.resolve({ page: ["1", "2"] }) });
    expect(mocks.list).toHaveBeenCalledWith((await params).eventId, NaN);
  });
  it("renders independently sourced counts and the actual identity form for authorised access", async () => {
    const { eventId } = await params;
    mocks.list.mockResolvedValue({ ok: true, eventId, page: 1, total: 0, items: [] });
    mocks.summary.mockResolvedValue({ ok: true, registrationCount: 0, confirmedAttendanceCount: 3 });
    mocks.event.mockResolvedValue({ ok: true, record: { name: "Fictional Event", requiresStudentId: true } });
    const html = renderToStaticMarkup(await Page({ params, searchParams: Promise.resolve({}) }));
    expect(html).toContain('data-testid="registered-count">0'); expect(html).toContain('data-testid="attendance-count">3'); expect(html).toContain("Student ID"); expect(html).toContain("Register participant");
    expect(mocks.summary).toHaveBeenCalledWith(eventId); expect(mocks.count).not.toHaveBeenCalled();
  });
});
