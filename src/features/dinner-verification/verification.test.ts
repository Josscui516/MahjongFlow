import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { DinnerRosterRecord, DinnerRosterResult } from "./roster";
import { createDinnerVerificationReader } from "./server";
import { initialVerificationState, verificationReducer } from "./refresh-state";
import type { DinnerVerificationResult } from "./contracts";

const eventId = "36000000-0000-4000-8000-000000000001";
const participantId = "36000000-0000-4000-8000-000000000002";
const readAt = "2026-09-28T05:00:00.000Z";
const row: DinnerRosterRecord = { eventId, participantId,
  participantName: "Fictional Casey", participantEmail: "casey@example.test",
  status: "listed",
};
const snapshot = (items: readonly DinnerRosterRecord[]): DinnerRosterResult => ({ ok: true, event: { id: eventId, name: "Fictional Dinner" }, items });
const latest: DinnerVerificationResult = { ok: true, event: { id: eventId, name: "Fictional Dinner" }, items: [], eligibleCount: 0, readAt };

describe("D-03 minimal verification list", () => {
  it("projects only necessary identity, result and one consistent aggregate", async () => {
    const result = await createDinnerVerificationReader({ listForEvent: async () => snapshot([
      row, { ...row, participantId: "36000000-0000-4000-8000-000000000004", status: "removed" },
    ]) }, () => new Date(readAt))(eventId);
    expect(result).toEqual({ ok: true, event: { id: eventId, name: "Fictional Dinner" }, readAt, eligibleCount: 1, items: [
      { participantId, participantName: row.participantName, participantEmail: row.participantEmail, eligibility: "Eligible" },
      { participantId: "36000000-0000-4000-8000-000000000004", participantName: row.participantName, participantEmail: row.participantEmail, eligibility: "Not Eligible Yet" },
    ] });
    expect(JSON.stringify(result)).not.toMatch(/recordedBy|checkedInAt|updatedAt|Private operator|method|student/i);
  });
  it.each(["PERMISSION_DENIED", "UNAUTHENTICATED", "SYSTEM_ERROR", "UNAVAILABLE", "VALIDATION"] as const)("preserves %s without a zero aggregate", async (code) => {
    expect(await createDinnerVerificationReader({ listForEvent: async () => ({ ok: false, code }) })(eventId)).toEqual({ ok: false, code });
  });
  it("handles empty attendance without introducing registration eligibility", async () => {
    expect(await createDinnerVerificationReader({ listForEvent: async () => snapshot([]) }, () => new Date(readAt))(eventId)).toEqual(latest);
  });
  it("normalises UUID casing", async () => {
    expect(await createDinnerVerificationReader({ listForEvent: async () => snapshot([row]) })(eventId.toUpperCase())).toMatchObject({ ok: true, eligibleCount: 1 });
  });
  it.each([
    snapshot([row, row]),
    snapshot([{ ...row, eventId: "36000000-0000-4000-8000-000000000009" }]),
    snapshot([{ ...row, participantId: "invalid" }]),
    { ...snapshot([]), event: { id: "wrong", name: "Wrong event" } },
  ])("fails closed on invalid provider scope or duplicate facts", async (result) => {
    expect(await createDinnerVerificationReader({ listForEvent: async () => result as DinnerRosterResult })(eventId)).toEqual({ ok: false, code: "SYSTEM_ERROR" });
  });
  it("maps thrown errors safely", async () => {
    expect(await createDinnerVerificationReader({ listForEvent: async () => { throw new Error("private failure"); } })(eventId)).toEqual({ ok: false, code: "SYSTEM_ERROR" });
  });
  it("reads each request anew and recalculates counts after a correction", async () => {
    const port = { listForEvent: vi.fn().mockResolvedValueOnce(snapshot([row])).mockResolvedValueOnce(snapshot([{ ...row, status: "removed" }])) };
    const read = createDinnerVerificationReader(port);
    expect(await read(eventId)).toMatchObject({ eligibleCount: 1 });
    expect(await read(eventId)).toMatchObject({ eligibleCount: 0, items: [{ eligibility: "Not Eligible Yet" }] });
    expect(port.listForEvent).toHaveBeenCalledTimes(2);
  });
});

describe("D-04 concurrent and stale verification", () => {
  const state = initialVerificationState(latest);
  it("marks old results stale during refresh", () => {
    expect(verificationReducer(state, { type: "start", request: 1 })).toMatchObject({ pending: true, stale: true });
  });
  it("does not overwrite a newer response with an older request", () => {
    const pending = verificationReducer(state, { type: "start", request: 2 });
    const fresh = verificationReducer(pending, { type: "finish", request: 2, result: latest });
    expect(verificationReducer(fresh, { type: "finish", request: 1, result: { ok: false, code: "SYSTEM_ERROR" } })).toBe(fresh);
  });
  it("retains prior values but clearly marks a failed refresh stale", () => {
    const pending = verificationReducer(state, { type: "start", request: 1 });
    expect(verificationReducer(pending, { type: "finish", request: 1, result: { ok: false, code: "SYSTEM_ERROR" } })).toMatchObject({ result: latest, pending: false, stale: true, refreshFailed: true });
  });
  it.each(["PERMISSION_DENIED", "UNAUTHENTICATED", "UNAVAILABLE"] as const)("clears cached identities on %s", (code) => {
    const pending = verificationReducer(state, { type: "start", request: 1 });
    expect(verificationReducer(pending, { type: "finish", request: 1, result: { ok: false, code } })).toMatchObject({ result: { ok: false, code }, stale: false });
  });
  it("clears stale/error flags after a successful subsequent verification", () => {
    const pending = verificationReducer({ ...state, stale: true, refreshFailed: true }, { type: "start", request: 2 });
    expect(verificationReducer(pending, { type: "finish", request: 2, result: latest })).toMatchObject({ stale: false, refreshFailed: false, pending: false });
  });
});
