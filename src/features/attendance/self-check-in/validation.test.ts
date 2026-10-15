import { describe, expect, it } from "vitest";
import { isCheckInToken, parseSelfCheckInInput } from "./validation";

const token = "a".repeat(64);

describe("self check-in validation", () => {
  it("accepts first-time registration details and refuses missing consent or name", () => {
    const details = { fullName: "Fictional   New Person", email: "new@example.test", privacyAccepted: true };
    expect(parseSelfCheckInInput(token, details)).toMatchObject({ fullName: "Fictional New Person", studentId: null });
    expect(parseSelfCheckInInput(token, { ...details, privacyAccepted: false })).toBeNull();
    expect(parseSelfCheckInInput(token, { ...details, fullName: "" })).toBeNull();
  });
  it("normalises only the minimum approved participant fields", () => {
    expect(parseSelfCheckInInput(token, { fullName: " Fictional Person ", privacyAccepted: true, email: " FICTIONAL@EXAMPLE.TEST ", ignored: "value", studentId: " TEST-0031 " })).toEqual({ fullName: "Fictional Person", privacyAccepted: true, email: "fictional@example.test", studentId: "TEST-0031", token });
  });

  it("rejects malformed tokens, emails and oversized student IDs", () => {
    expect(isCheckInToken("not-a-token")).toBe(false);
    expect(parseSelfCheckInInput("b".repeat(63), { email: "person@example.test" })).toBeNull();
    expect(parseSelfCheckInInput(token, { email: "not-an-email" })).toBeNull();
    expect(parseSelfCheckInInput(token, { email: "person@example.test", studentId: "x".repeat(33) })).toBeNull();
  });
});
