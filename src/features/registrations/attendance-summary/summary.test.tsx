import { createClient } from "@supabase/supabase-js";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { Database } from "@/types/database.generated";
import { AuthorizationError } from "@/lib/auth/authorization";
import { createParticipationSummaryService } from "./service";
import { ParticipationSummary } from "./ParticipationSummary";
const eventId = "28000000-0000-4000-8000-000000000021";
function setup(body: unknown = [{ event_id: eventId, registration_count: 2, attendance_count: 5, participant_email: "never-expose@example.test" }], role: "committee" | "authorised" = "committee", status = 200) {
  const fetcher = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
  const client = createClient<Database>("https://summary.example.test", "fictional-key", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetcher } });
  const getClient = vi.fn(async () => client);
  const authorise = vi.fn(async () => ({ role, userId: "fictional-operator", canManageAccounts: false }));
  return { service: createParticipationSummaryService({ authorise, getClient }), fetcher, authorise, getClient };
}
describe("independent participation totals", () => {
  it.each(["committee", "authorised"] as const)("returns only safe numbers for %s from one RPC", async role => {
    const { service, fetcher } = setup(undefined, role);
    expect(await service.get(eventId)).toEqual({ ok: true, registrationCount: 2, confirmedAttendanceCount: 5 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toContain("/rpc/get_event_participation_totals");
    expect(JSON.parse(String(init.body))).toEqual({ event_ids: [eventId] });
  });
  it.each(["UNAUTHENTICATED", "FORBIDDEN"] as const)("rejects %s before database access", async code => {
    const { service, authorise, getClient } = setup(); authorise.mockRejectedValue(new AuthorizationError(code));
    expect(await service.get(eventId)).toEqual({ ok: false, code: code === "UNAUTHENTICATED" ? code : "PERMISSION_DENIED" }); expect(getClient).not.toHaveBeenCalled();
  });
  it("rejects invalid IDs before database access", async () => { const { service, getClient } = setup(); expect(await service.get("invalid")).toMatchObject({ code: "VALIDATION" }); expect(getClient).not.toHaveBeenCalled(); });
  it("does not report an unavailable event as zero", async () => { const { service } = setup([]); expect(await service.get(eventId)).toMatchObject({ code: "UNAVAILABLE" }); });
  it.each([-1, 1.2, "2", null])("rejects malformed attendance count %s", async count => { const { service } = setup([{ event_id: eventId, registration_count: 2, attendance_count: count }]); expect(await service.get(eventId)).toMatchObject({ code: "SYSTEM_ERROR" }); });
  it("maps denied RPCs without leaking internal error messages", async () => { const { service } = setup({ code: "42501", message: "private detail" }, "committee", 403); expect(await service.get(eventId)).toEqual({ ok: false, code: "PERMISSION_DENIED" }); });
  it("maps transport failure safely", async () => { const { service, fetcher } = setup(); fetcher.mockRejectedValue(new Error("private detail")); expect(await service.get(eventId)).toMatchObject({ ok: false, code: "SYSTEM_ERROR" }); });
  it("renders separate numbers without deriving attendance or dinner eligibility", () => {
    const html = renderToStaticMarkup(<ParticipationSummary result={{ ok: true, registrationCount: 0, confirmedAttendanceCount: 3 }} />);
    expect(html).toContain('data-testid="registered-count">0'); expect(html).toContain('data-testid="attendance-count">3'); expect(html).toContain("Registration does not confirm attendance or dinner eligibility"); expect(html).toContain("Authorised staff confirm attendance separately");
  });
  it("shows loading and failure without fabricated zero counts", () => { expect(renderToStaticMarkup(<ParticipationSummary />)).toContain("Loading participation totals"); const html = renderToStaticMarkup(<ParticipationSummary result={{ ok: false, code: "SYSTEM_ERROR" }} />); expect(html).toContain('role="alert"'); expect(html).not.toContain('data-testid="attendance-count"'); });
});
