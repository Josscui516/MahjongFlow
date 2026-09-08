import { describe, expect, it } from "vitest";

import type { ParticipantIdentityRawInput } from "./contracts";
import {
  PARTICIPANT_EMAIL_MAX_LENGTH,
  PARTICIPANT_FULL_NAME_MAX_LENGTH,
  PARTICIPANT_STUDENT_ID_MAX_LENGTH,
  participantIdentityFormValues,
  readParticipantIdentityFormData,
  validateParticipantIdentity,
} from "./validation";

const VALID_INPUT: ParticipantIdentityRawInput = {
  email: "player@example.test",
  fullName: "Fictional Player",
  studentId: "TEST-2601",
};

describe("validateParticipantIdentity", () => {
  it("normalises the three approved fields for an ID-requiring event", () => {
    const result = validateParticipantIdentity(
      {
        email: "  PLAYER@EXAMPLE.TEST ",
        fullName: "  Fictional\t  Player  ",
        studentId: " TEST-2601 ",
      },
      { requiresStudentId: true },
    );

    expect(result).toEqual({
      errors: [],
      ok: true,
      value: {
        email: "player@example.test",
        fullName: "Fictional Player",
        studentId: "TEST-2601",
      },
    });
  });

  it("stores a blank student ID as null for an ordinary event", () => {
    const result = validateParticipantIdentity(
      { ...VALID_INPUT, studentId: "   " },
      { requiresStudentId: false },
    );

    expect(result.ok && result.value.studentId).toBeNull();
  });

  it("rejects a missing ID only when the trusted event requires it", () => {
    const result = validateParticipantIdentity(
      { ...VALID_INPUT, studentId: "" },
      { requiresStudentId: true },
    );

    expect(result).toEqual({
      errors: [
        expect.objectContaining({
          code: "STUDENT_ID_REQUIRED",
          field: "studentId",
        }),
      ],
      ok: false,
    });
  });

  it("rejects an unnecessary ID instead of collecting excess identity data", () => {
    const result = validateParticipantIdentity(VALID_INPUT, {
      requiresStudentId: false,
    });

    expect(result).toEqual({
      errors: [
        expect.objectContaining({
          code: "STUDENT_ID_NOT_ALLOWED",
          field: "studentId",
        }),
      ],
      ok: false,
    });
  });

  it("returns ordered field errors for empty and invalid values", () => {
    const result = validateParticipantIdentity(
      { email: "not-an-email", fullName: "  ", studentId: "" },
      { requiresStudentId: true },
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected validation errors");
    expect(result.errors.map(({ code }) => code)).toEqual([
      "FULL_NAME_REQUIRED",
      "EMAIL_INVALID",
      "STUDENT_ID_REQUIRED",
    ]);
  });

  it("accepts exact character limits and rejects values one character over", () => {
    const valid = validateParticipantIdentity(
      {
        email: `${"e".repeat(PARTICIPANT_EMAIL_MAX_LENGTH - 13)}@example.test`,
        fullName: "名".repeat(PARTICIPANT_FULL_NAME_MAX_LENGTH),
        studentId: "S".repeat(PARTICIPANT_STUDENT_ID_MAX_LENGTH),
      },
      { requiresStudentId: true },
    );
    expect(valid.ok).toBe(true);

    const invalid = validateParticipantIdentity(
      {
        email: `${"e".repeat(PARTICIPANT_EMAIL_MAX_LENGTH - 12)}@example.test`,
        fullName: "名".repeat(PARTICIPANT_FULL_NAME_MAX_LENGTH + 1),
        studentId: "S".repeat(PARTICIPANT_STUDENT_ID_MAX_LENGTH + 1),
      },
      { requiresStudentId: true },
    );

    expect(invalid.ok).toBe(false);
    if (invalid.ok) throw new Error("Expected validation errors");
    expect(invalid.errors.map(({ code }) => code)).toEqual([
      "FULL_NAME_TOO_LONG",
      "EMAIL_TOO_LONG",
      "STUDENT_ID_TOO_LONG",
    ]);
  });

  it("projects only approved identity fields from a forged object", () => {
    const result = validateParticipantIdentity(
      {
        ...VALID_INPUT,
        phone: "+61 400 000 000",
        paymentCard: "not-retained",
      } as ParticipantIdentityRawInput,
      { requiresStudentId: true },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected valid identity");
    expect(result.value).toEqual({
      email: VALID_INPUT.email,
      fullName: VALID_INPUT.fullName,
      studentId: VALID_INPUT.studentId,
    });
    expect(JSON.stringify(result.value)).not.toContain("phone");
    expect(JSON.stringify(result.value)).not.toContain("payment");
  });
});

describe("participant identity server-boundary readers", () => {
  it("preserves repeated values so validation rejects forged cardinality", () => {
    const formData = new FormData();
    formData.append("fullName", "First Name");
    formData.append("fullName", "Second Name");
    formData.append("email", "first@example.test");
    formData.append("email", "second@example.test");
    formData.append("studentId", "TEST-1");
    formData.append("studentId", "TEST-2");

    const raw = readParticipantIdentityFormData(formData);
    const result = validateParticipantIdentity(raw, {
      requiresStudentId: true,
    });

    expect(raw).toEqual({
      email: ["first@example.test", "second@example.test"],
      fullName: ["First Name", "Second Name"],
      studentId: ["TEST-1", "TEST-2"],
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected validation errors");
    expect(result.errors.map(({ code }) => code)).toEqual([
      "FULL_NAME_INVALID_CARDINALITY",
      "EMAIL_INVALID_CARDINALITY",
      "STUDENT_ID_INVALID_CARDINALITY",
    ]);
  });

  it("preserves only safe strings when rebuilding form values", () => {
    expect(
      participantIdentityFormValues({
        email: ["forged@example.test"],
        fullName: "Fictional Player",
        studentId: undefined,
      }),
    ).toEqual({
      email: "",
      fullName: "Fictional Player",
      studentId: "",
    });
  });
});
