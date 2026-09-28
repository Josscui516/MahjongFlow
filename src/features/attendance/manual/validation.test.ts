import { describe, expect, it } from "vitest";

import type { ManualAttendanceField } from "./contracts";
import { validateManualAttendance } from "./validation";

const EVENT_ID = "33abcdef-0000-4000-8000-000000000001";
const RECORD_ID = "33abcdef-0000-4000-8000-000000000002";
const VERSION = "2026-09-28T04:12:34.123456+00:00";

function createForm() {
  const form = new FormData();
  form.set("operation", "create");
  form.set("email", "fictional.participant@example.test");
  form.set("confirmation", "confirmed");
  return form;
}

function correctionForm() {
  const form = new FormData();
  form.set("operation", "correct");
  form.set("recordId", RECORD_ID);
  form.set("expectedUpdatedAt", VERSION);
  form.set("targetStatus", "voided");
  form.set("confirmation", "confirmed");
  return form;
}

function expectInvalid(form: FormData, field: ManualAttendanceField, eventId: unknown = EVENT_ID) {
  const result = validateManualAttendance(eventId, form);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field })]));
}

describe("manual attendance input validation", () => {
  it("normalises an existing participant email and the bound event UUID", () => {
    const form = createForm();
    form.set("email", "  FICTIONAL.Participant@EXAMPLE.TEST  ");
    expect(validateManualAttendance(EVENT_ID.toUpperCase(), form)).toEqual({
      ok: true,
      command: { operation: "create", eventId: EVENT_ID, email: "fictional.participant@example.test" },
    });
  });

  it.each(["confirmed", "voided"] as const)("keeps microseconds verbatim for a correction to %s", (targetStatus) => {
    const form = correctionForm();
    form.set("recordId", RECORD_ID.toUpperCase());
    form.set("targetStatus", targetStatus);
    expect(validateManualAttendance(EVENT_ID, form)).toEqual({
      ok: true,
      command: { operation: "correct", eventId: EVENT_ID, recordId: RECORD_ID, expectedUpdatedAt: VERSION, targetStatus },
    });
  });

  it.each(["", "missing", null, 123, "33abcdef-0000-0000-8000-000000000001", "33abcdef-0000-4000-0000-000000000001", ` ${EVENT_ID}`])(
    "rejects invalid bound event ID %s", (eventId) => expectInvalid(createForm(), "eventId", eventId),
  );

  it.each(["", "fictional", "fictional@localhost", "fictional participant@example.test", "fictional@@example.test", `${"a".repeat(250)}@example.test`])(
    "rejects invalid participant email %s", (email) => {
      const form = createForm();
      form.set("email", email);
      expectInvalid(form, "email");
    },
  );

  it.each(["operation", "email", "confirmation"] as const)("requires a single string %s for creation", (field) => {
    for (const malformed of ["missing", "duplicate", "file"] as const) {
      const form = createForm();
      if (malformed === "missing") form.delete(field);
      if (malformed === "duplicate") form.append(field, String(form.get(field)));
      if (malformed === "file") form.set(field, new File(["fictional"], "fixture.txt"));
      expectInvalid(form, field);
    }
  });

  it.each(["operation", "recordId", "expectedUpdatedAt", "targetStatus", "confirmation"] as const)("requires a single string %s for correction", (field) => {
    for (const malformed of ["missing", "duplicate", "file"] as const) {
      const form = correctionForm();
      if (malformed === "missing") form.delete(field);
      if (malformed === "duplicate") form.append(field, String(form.get(field)));
      if (malformed === "file") form.set(field, new File(["fictional"], "fixture.txt"));
      expectInvalid(form, field);
    }
  });

  it.each(["true", "on", "false", " confirmed "])("requires explicit confirmation rather than %s", (confirmation) => {
    const form = createForm();
    form.set("confirmation", confirmation);
    expectInvalid(form, "confirmation");
  });

  it("rejects invalid operation, record ID and target status", () => {
    const create = createForm();
    create.set("operation", "delete");
    expectInvalid(create, "operation");
    const correction = correctionForm();
    correction.set("recordId", "not-an-id");
    correction.set("targetStatus", "eligible");
    expectInvalid(correction, "recordId");
    expectInvalid(correction, "targetStatus");
  });

  it.each([
    "2026-02-30T12:00:00.123456Z", "2026-02-29T12:00:00Z",
    "2100-02-29T12:00:00Z", "2026-04-31T12:00:00Z",
    "2026-09-28T24:00:00Z", "2026-09-28T12:60:00Z",
    "2026-09-28T12:00:60Z", "2026-00-28T12:00:00Z",
    "2026-13-28T12:00:00Z", "2026-09-00T12:00:00Z",
    "2026-09-28", "2026-09-28T12:00:00", "2026-09-28 12:00:00Z",
    "2026-09-28T12:00:00.1234567Z", "not-a-date",
  ])("rejects malformed or impossible version %s", (version) => {
    const form = correctionForm();
    form.set("expectedUpdatedAt", version);
    expectInvalid(form, "expectedUpdatedAt");
  });

  it.each(["2024-02-29T12:00:00Z", "2000-02-29T12:00:00.000001Z", "2026-09-28T12:00:00.1+10:00", VERSION])(
    "preserves valid exact version %s", (version) => {
      const form = correctionForm();
      form.set("expectedUpdatedAt", version);
      expect(validateManualAttendance(EVENT_ID, form)).toEqual({
        ok: true,
        command: { operation: "correct", eventId: EVENT_ID, recordId: RECORD_ID, expectedUpdatedAt: version, targetStatus: "voided" },
      });
    },
  );

  it("never copies browser-supplied provenance, participant ID or event scope into the command", () => {
    const form = createForm();
    for (const field of ["eventId", "participantId", "recordedBy", "checkedInAt", "updatedAt", "method", "attendanceStatus"]) {
      form.set(field, "forged");
    }
    expect(validateManualAttendance(EVENT_ID, form)).toEqual({
      ok: true,
      command: { operation: "create", eventId: EVENT_ID, email: "fictional.participant@example.test" },
    });
  });
});
