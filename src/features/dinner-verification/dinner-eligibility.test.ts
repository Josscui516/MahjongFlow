import { describe, expect, it } from "vitest";

import {
  calculateDinnerEligibility,
  type DinnerRosterFact,
} from "./index";

const eventId = "70000000-0000-4000-8000-000000000001";
const participantId = "70000000-0000-4000-8000-000000000002";
const otherEventId = "70000000-0000-4000-8000-000000000003";
const otherParticipantId = "70000000-0000-4000-8000-000000000004";

const confirmed: DinnerRosterFact = Object.freeze({
  eventId,
  participantId,
  rosterStatus: "listed",
});

describe("DINNER-01/02: current activity dinner eligibility", () => {
  it("D-01: accepts the current participant's active roster membership", () => {
    expect(calculateDinnerEligibility(eventId, participantId, confirmed)).toBe(
      "Eligible",
    );
  });

  it.each([null, undefined])("D-02: missing roster (%s) is not eligible", (fact) => {
    expect(calculateDinnerEligibility(eventId, participantId, fact)).toBe(
      "Not Eligible Yet",
    );
  });

  it("D-02: a removed roster entry is not eligible", () => {
    expect(calculateDinnerEligibility(eventId, participantId, {
      ...confirmed,
      rosterStatus: "removed",
    })).toBe("Not Eligible Yet");
  });

  it("does not reuse active roster membership from another activity", () => {
    expect(calculateDinnerEligibility(otherEventId, participantId, confirmed)).toBe(
      "Not Eligible Yet",
    );
  });

  it("does not grant eligibility from another participant's roster", () => {
    expect(calculateDinnerEligibility(eventId, otherParticipantId, confirmed)).toBe(
      "Not Eligible Yet",
    );
  });

  it.each(["", "   "])("does not accept an empty activity scope (%s)", (emptyId) => {
    expect(calculateDinnerEligibility(emptyId, participantId, {
      ...confirmed,
      eventId: emptyId,
    })).toBe("Not Eligible Yet");
  });

  it.each(["", "   "])("does not accept an empty participant scope (%s)", (emptyId) => {
    expect(calculateDinnerEligibility(eventId, emptyId, {
      ...confirmed,
      participantId: emptyId,
    })).toBe("Not Eligible Yet");
  });

  it("fails closed for an unrecognised runtime roster status", () => {
    const invalid = { ...confirmed, rosterStatus: "registered" };
    expect(calculateDinnerEligibility(
      eventId,
      participantId,
      invalid as DinnerRosterFact,
    )).toBe("Not Eligible Yet");
  });

  it("registration alone does not grant eligibility", () => {
    const registeredParticipant = { eventId, participantId, registrationStatus: "registered" };
    expect(calculateDinnerEligibility(
      registeredParticipant.eventId,
      registeredParticipant.participantId,
      null,
    )).toBe("Not Eligible Yet");
  });

  it("accepts confirmed manual roster without requiring registration or extra identity fields", () => {
    const manual = { ...confirmed, checkInMethod: "manual", registration: null };
    expect(calculateDinnerEligibility(eventId, participantId, manual)).toBe("Eligible");
  });

  it("uses each supplied current fact without retaining a previous result", () => {
    const voided: DinnerRosterFact = { ...confirmed, rosterStatus: "removed" };
    const results = [confirmed, voided, confirmed, null].map((fact) =>
      calculateDinnerEligibility(eventId, participantId, fact),
    );
    expect(results).toEqual(["Eligible", "Not Eligible Yet", "Eligible", "Not Eligible Yet"]);
  });

  it("does not mutate or attach an independent eligibility state to roster", () => {
    const before = { ...confirmed };
    calculateDinnerEligibility(eventId, participantId, confirmed);
    expect(confirmed).toEqual(before);
    expect(Object.keys(confirmed).sort()).toEqual([
      "eventId", "participantId", "rosterStatus",
    ]);
  });
});
