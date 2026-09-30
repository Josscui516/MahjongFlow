import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AttendanceAuditRecord, AttendanceAuditResult } from "@/features/attendance/records";
import { createDinnerEligibilityReader } from "./server";

const eventId = "35000000-0000-4000-8000-00000000000a";
const participantId = "35000000-0000-4000-8000-00000000000b";
const record: AttendanceAuditRecord = {
  id: "35000000-0000-4000-8000-00000000000c",
  eventId, participantId, status: "confirmed", method: "qr", recordedBy: null,
  participantName: "Fictional Dinner Attendee", participantEmail: "dinner@example.test",
  checkedInAt: "2026-09-28T01:00:00Z", updatedAt: "2026-09-28T01:00:00Z",
};
const snapshot = (items: readonly AttendanceAuditRecord[]): AttendanceAuditResult => ({
  ok: true, event: { id: eventId, name: "Fictional Dinner Event" }, items,
});

describe("dinner eligibility public provider adapter", () => {
  it("maps the actual audit contract and returns only scope and eligibility", async () => {
    const listForEvent = vi.fn(async () => snapshot([record]));
    const result = await createDinnerEligibilityReader({ listForEvent })(eventId, participantId);
    expect(result).toEqual({ ok: true, eventId, participantId, eligibility: "Eligible" });
    expect(listForEvent).toHaveBeenCalledWith(eventId);
  });

  it("normalises valid uppercase UUID inputs before comparing provider facts", async () => {
    const read = createDinnerEligibilityReader({ listForEvent: async () => snapshot([record]) });
    expect(await read(eventId.toUpperCase(), participantId.toUpperCase())).toEqual({
      ok: true, eventId, participantId, eligibility: "Eligible",
    });
  });

  it.each(["PERMISSION_DENIED", "UNAUTHENTICATED", "SYSTEM_ERROR", "VALIDATION", "UNAVAILABLE"] as const)(
    "preserves provider %s without leaking data or claiming non-eligibility", async (code) => {
      const read = createDinnerEligibilityReader({ listForEvent: async () => ({ ok: false, code }) });
      expect(await read(eventId, "invalid")).toEqual({ ok: false, code });
    },
  );

  it("keeps thrown provider failures safe", async () => {
    const read = createDinnerEligibilityReader({ listForEvent: async () => { throw new Error("private detail"); } });
    expect(await read(eventId, participantId)).toEqual({ ok: false, code: "SYSTEM_ERROR" });
  });

  it("validates participant scope after the authorised provider read", async () => {
    const read = createDinnerEligibilityReader({ listForEvent: async () => snapshot([]) });
    expect(await read(eventId, "invalid")).toEqual({ ok: false, code: "VALIDATION" });
  });

  it("does not retain confirmed eligibility after the supplied current fact changes", async () => {
    const listForEvent = vi.fn()
      .mockResolvedValueOnce(snapshot([record]))
      .mockResolvedValueOnce(snapshot([{ ...record, status: "voided", recordedBy: { displayName: "Fictional Corrector" } }]))
      .mockResolvedValueOnce(snapshot([]));
    const read = createDinnerEligibilityReader({ listForEvent });
    expect(await read(eventId, participantId)).toMatchObject({ eligibility: "Eligible" });
    expect(await read(eventId, participantId)).toMatchObject({ eligibility: "Not Eligible Yet" });
    expect(await read(eventId, participantId)).toMatchObject({ eligibility: "Not Eligible Yet" });
    expect(listForEvent).toHaveBeenCalledTimes(3);
  });

  it("rejects conflicting duplicate current facts instead of choosing one", async () => {
    const read = createDinnerEligibilityReader({ listForEvent: async () => snapshot([record, record]) });
    expect(await read(eventId, participantId)).toEqual({ ok: false, code: "SYSTEM_ERROR" });
  });

  it("rejects a mismatched activity response", async () => {
    const read = createDinnerEligibilityReader({ listForEvent: async () => snapshot([record]) });
    expect(await read("35000000-0000-4000-8000-000000000099", participantId)).toEqual({ ok: false, code: "SYSTEM_ERROR" });
  });

  it("rejects out-of-scope rows even when the event context matches", async () => {
    const read = createDinnerEligibilityReader({ listForEvent: async () => snapshot([{ ...record, eventId: "other-event" }]) });
    expect(await read(eventId, participantId)).toEqual({ ok: false, code: "SYSTEM_ERROR" });
  });
});
