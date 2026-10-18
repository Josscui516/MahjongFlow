import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ authorise: vi.fn(), createClient: vi.fn() }));
vi.mock("@/lib/auth/authorization", async original => ({
  ...await original<typeof import("@/lib/auth/authorization")>(), requireAuthorised: mocks.authorise,
}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.createClient }));
import { AuthorizationError } from "@/lib/auth/authorization";
import { matchedDinnerAttendance } from "./matched-attendance";

const eventId = "a2100000-0000-4000-8000-000000000001";
beforeEach(() => vi.resetAllMocks());
it("denies access before even validating an event or opening a database client", async () => {
  mocks.authorise.mockRejectedValue(new AuthorizationError("FORBIDDEN"));
  expect(await matchedDinnerAttendance.listForEvent("invalid")).toEqual({ ok: false, code: "PERMISSION_DENIED" });
  expect(mocks.createClient).not.toHaveBeenCalled();
});
it("rejects malformed event IDs after authorisation", async () => {
  expect(await matchedDinnerAttendance.listForEvent("invalid")).toEqual({ ok: false, code: "VALIDATION" });
  expect(mocks.createClient).not.toHaveBeenCalled();
});
it.each([null, { message: "private failure" }])("preserves unavailable or failed event reads", async error => {
  mocks.createClient.mockResolvedValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error }) }) }) }) });
  expect(await matchedDinnerAttendance.listForEvent(eventId)).toEqual({ ok: false, code: error ? "SYSTEM_ERROR" : "UNAVAILABLE" });
});
it.each([false, true])("paginates matched identities and never returns partial results on a failed later page: %s", async failed => {
  const first = Array.from({ length: 250 }, (_, i) => ({ event_id: eventId, participant_id: `fixture-${i}`, full_name: "Fictional Attendee", eligible: true, issued_at: null, email: `dinner-${i}@example.test` }));
  const range = vi.fn().mockResolvedValueOnce({ data: first, error: null })
    .mockResolvedValueOnce(failed ? { data: null, error: { message: "private failure" } } : { data: [], error: null });
  const rpc = vi.fn(() => ({ order: () => ({ range }) }));
  mocks.createClient.mockResolvedValue({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: eventId, name: "Fictional event" }, error: null }) }) }) }), rpc,
  });
  const result = await matchedDinnerAttendance.listForEvent(eventId);
  expect(rpc).toHaveBeenCalledWith("list_event_dinner_service", { target_event_id: eventId });
  expect(range.mock.calls).toEqual([[0, 249], [250, 499]]);
  if (failed) expect(result).toEqual({ ok: false, code: "SYSTEM_ERROR" });
  else {
    expect(result.ok && result.items).toHaveLength(250);
    expect(result.ok && result.items[0]).toEqual({ eventId, participantId: "fixture-0", participantName: "Fictional Attendee", participantEmail: "dinner-0@example.test", status: "listed", issuedAt: null });
  }
});
