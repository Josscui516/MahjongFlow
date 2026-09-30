import { describe, expect, it } from "vitest";
import { isCheckInToken, parseSelfCheckInInput } from "./validation";

const token = "a".repeat(64);

describe("self check-in validation", () => {
  it("normalises only the minimum approved participant fields", () => {
    expect(parseSelfCheckInInput(token, { email: " FICTIONAL@EXAMPLE.TEST ", ignored: "value", studentId: " TEST-0031 " })).toEqual({ email: "fictional@example.test", studentId: "TEST-0031", token });
  });

  it("rejects malformed tokens, emails and oversized student IDs", () => {
    expect(isCheckInToken("not-a-token")).toBe(false);
    expect(parseSelfCheckInInput("b".repeat(63), { email: "person@example.test" })).toBeNull();
    expect(parseSelfCheckInInput(token, { email: "not-an-email" })).toBeNull();
    expect(parseSelfCheckInInput(token, { email: "person@example.test", studentId: "x".repeat(33) })).toBeNull();
  });
});
