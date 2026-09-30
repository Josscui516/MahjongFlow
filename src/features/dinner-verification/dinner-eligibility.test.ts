import { describe, expect, it } from "vitest";

import {
  calculateDinnerEligibility,
  type DinnerAttendanceFact,
} from "./index";

const eventId = "70000000-0000-4000-8000-000000000001";
const participantId = "70000000-0000-4000-8000-000000000002";
const otherEventId = "70000000-0000-4000-8000-000000000003";
const otherParticipantId = "70000000-0000-4000-8000-000000000004";

const confirmed: DinnerAttendanceFact = Object.freeze({
  eventId,
  participantId,
  attendanceStatus: "confirmed",
});

describe("DINNER-01/02: current activity dinner eligibility", () => {
  it("D-01: accepts the current participant's confirmed attendance", () => {
    expect(calculateDinnerEligibility(eventId, participantId, confirmed)).toBe(
      "Eligible",
    );
  });

  it.each([null, undefined])("D-02: missing attendance (%s) is not eligible", (fact) => {
    expect(calculateDinnerEligibility(eventId, participantId, fact)).toBe(
      "Not Eligible Yet",
    );
  });

  it("D-02: a voided record is not eligible", () => {
    expect(calculateDinnerEligibility(eventId, participantId, {
      ...confirmed,
      attendanceStatus: "voided",
    })).toBe("Not Eligible Yet");
  });

  it("does not reuse confirmed attendance from another activity", () => {
    expect(calculateDinnerEligibility(otherEventId, participantId, confirmed)).toBe(
      "Not Eligible Yet",
    );
  });

  it("does not grant eligibility from another participant's attendance", () => {
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

  it("fails closed for an unrecognised runtime attendance status", () => {
    const invalid = { ...confirmed, attendanceStatus: "registered" };
    expect(calculateDinnerEligibility(
      eventId,
      participantId,
      invalid as DinnerAttendanceFact,
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

  it("accepts confirmed manual attendance without requiring registration or extra identity fields", () => {
    const manual = { ...confirmed, checkInMethod: "manual", registration: null };
    expect(calculateDinnerEligibility(eventId, participantId, manual)).toBe("Eligible");
  });

  it("uses each supplied current fact without retaining a previous result", () => {
    const voided: DinnerAttendanceFact = { ...confirmed, attendanceStatus: "voided" };
    const results = [confirmed, voided, confirmed, null].map((fact) =>
      calculateDinnerEligibility(eventId, participantId, fact),
    );
    expect(results).toEqual(["Eligible", "Not Eligible Yet", "Eligible", "Not Eligible Yet"]);
  });

  it("does not mutate or attach an independent eligibility state to attendance", () => {
    const before = { ...confirmed };
    calculateDinnerEligibility(eventId, participantId, confirmed);
    expect(confirmed).toEqual(before);
    expect(Object.keys(confirmed).sort()).toEqual([
      "attendanceStatus", "eventId", "participantId",
    ]);
  });
});
