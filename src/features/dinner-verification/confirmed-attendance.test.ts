import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createConfirmedDinnerReader } from "./server";
import type { DinnerVerificationResult } from "./contracts";
import type { AttendanceAuditRecord } from "@/features/attendance/records";
const eventId = "36000000-0000-4000-8000-000000000001";
const dinner: DinnerVerificationResult = { ok: true, event: { id: eventId, name: "Fictional event" }, readAt: "2026-10-21T00:00:00Z", eligibleCount: 1, items: [
  { participantId: "eligible", participantName: "Fictional Eligible", participantEmail: "eligible@example.test", eligibility: "Eligible" },
  { participantId: "previous", participantName: "Fictional Previous", participantEmail: "previous@example.test", eligibility: "Not Eligible Yet", issuedAt: "2026-10-20T00:00:00Z" },
] };
const attendance = (participantId: string, status: "confirmed" | "voided" = "confirmed"): AttendanceAuditRecord => ({
  id: participantId, eventId, participantId, participantName: `Fictional ${participantId}`, participantEmail: `${participantId}@example.test`,
  status, method: "manual", recordedBy: { displayName: "Fictional Staff" }, checkedInAt: "2026-10-21T00:00:00Z", updatedAt: "2026-10-21T00:00:00Z",
});
describe("confirmed attendance dinner list", () => {
  it("includes all confirmed attendees, preserves eligibility and separates historical serving records", async () => {
    const read = createConfirmedDinnerReader(async () => dinner, { listForEvent: async () => ({ ok: true, event: dinner.event, items: [attendance("eligible"), attendance("unmatched"), attendance("previous", "voided")] }) });
    const result = await read(eventId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items.map(row => row.participantId)).toEqual(["eligible", "unmatched"]);
    expect(result.items[1].eligibility).toBe("Not Eligible Yet");
    expect(result.eligibleCount).toBe(1);
    expect(result.previousIssuedItems?.map(row => row.participantId)).toEqual(["previous"]);
    expect(result.items[0]).not.toHaveProperty("recordedBy");
  });
  it.each(["PERMISSION_DENIED", "UNAUTHENTICATED", "SYSTEM_ERROR"] as const)("fails closed when attendance returns %s", async code => {
    expect(await createConfirmedDinnerReader(async () => dinner, { listForEvent: async () => ({ ok: false, code }) })(eventId)).toEqual({ ok: false, code });
  });
  it("does not read attendance after dinner access is denied", async () => {
    const listForEvent = vi.fn();
    expect(await createConfirmedDinnerReader(async () => ({ ok: false, code: "PERMISSION_DENIED" }), { listForEvent })(eventId)).toEqual({ ok: false, code: "PERMISSION_DENIED" });
    expect(listForEvent).not.toHaveBeenCalled();
  });
  it("rejects an out-of-event attendance response", async () => {
    expect(await createConfirmedDinnerReader(async () => dinner, { listForEvent: async () => ({ ok: true, event: { id: "other", name: "Other" }, items: [] }) })(eventId)).toEqual({ ok: false, code: "SYSTEM_ERROR" });
  });
});
