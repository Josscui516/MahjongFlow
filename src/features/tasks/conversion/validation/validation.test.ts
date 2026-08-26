import { describe, expect, it } from "vitest";

import {
  FIXTURE_ASSIGNEE_ID,
  FIXTURE_SOURCE_CONTEXT,
  FIXTURE_TASK_VALUES,
} from "./fixtures";
import {
  isValidTaskSourceContext,
  readTaskConversionFormData,
  validateTaskConversion,
} from "./validation";

const OPTIONS = { allowedAssigneeIds: [FIXTURE_ASSIGNEE_ID] } as const;

describe("task conversion validation", () => {
  it("normalises every valid C-02 field and preserves its trusted source", () => {
    const result = validateTaskConversion(
      {
        ...FIXTURE_TASK_VALUES,
        description: `  ${FIXTURE_TASK_VALUES.description}  `,
        title: `  ${FIXTURE_TASK_VALUES.title}  `,
      },
      FIXTURE_SOURCE_CONTEXT,
      OPTIONS,
    );

    expect(result).toEqual({
      draft: {
        ...FIXTURE_TASK_VALUES,
        sourceContext: FIXTURE_SOURCE_CONTEXT,
      },
      errors: [],
      ok: true,
      sourceContext: FIXTURE_SOURCE_CONTEXT,
      values: FIXTURE_TASK_VALUES,
    });
  });

  it("rejects the missing assignee and due date required by C-03", () => {
    const result = validateTaskConversion(
      { ...FIXTURE_TASK_VALUES, assigneeId: "", dueDate: "" },
      FIXTURE_SOURCE_CONTEXT,
      OPTIONS,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual([
      "ASSIGNEE_REQUIRED",
      "DUE_DATE_REQUIRED",
    ]);
    expect(result.sourceContext).toBe(FIXTURE_SOURCE_CONTEXT);
    expect(result.values.title).toBe(FIXTURE_TASK_VALUES.title);
  });

  it("rejects repeated or array assignees as invalid C-06 cardinality", () => {
    const secondAssignee = "44444444-4444-4444-8444-444444444444";
    const result = validateTaskConversion(
      {
        ...FIXTURE_TASK_VALUES,
        assigneeId: [FIXTURE_ASSIGNEE_ID, secondAssignee],
      },
      FIXTURE_SOURCE_CONTEXT,
      { allowedAssigneeIds: [FIXTURE_ASSIGNEE_ID, secondAssignee] },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "ASSIGNEE_INVALID_CARDINALITY" }),
    );
    expect(result.values.assigneeId).toBe(FIXTURE_ASSIGNEE_ID);
  });

  it("detects duplicate assignee fields before object conversion can hide them", () => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(FIXTURE_TASK_VALUES)) {
      formData.append(key, value);
    }
    formData.append("assigneeId", "44444444-4444-4444-8444-444444444444");

    expect(readTaskConversionFormData(formData).assigneeId).toEqual([
      FIXTURE_ASSIGNEE_ID,
      "44444444-4444-4444-8444-444444444444",
    ]);
  });

  it("keeps an omitted FormData assignee distinct from repeated assignees", () => {
    const formData = new FormData();
    formData.set("title", FIXTURE_TASK_VALUES.title);
    formData.set("description", FIXTURE_TASK_VALUES.description);
    formData.set("dueDate", FIXTURE_TASK_VALUES.dueDate);
    formData.set("status", FIXTURE_TASK_VALUES.status);

    const result = validateTaskConversion(
      readTaskConversionFormData(formData),
      FIXTURE_SOURCE_CONTEXT,
      OPTIONS,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "ASSIGNEE_REQUIRED" }),
    );
  });

  it("rejects unknown statuses, impossible dates, and unavailable assignees", () => {
    const result = validateTaskConversion(
      {
        ...FIXTURE_TASK_VALUES,
        assigneeId: "55555555-5555-4555-8555-555555555555",
        dueDate: "2026-02-30",
        status: "overdue",
      },
      FIXTURE_SOURCE_CONTEXT,
      OPTIONS,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual([
      "ASSIGNEE_NOT_ALLOWED",
      "DUE_DATE_INVALID",
      "STATUS_NOT_ALLOWED",
    ]);
  });

  it("accepts only UUID meeting and source identifiers", () => {
    expect(isValidTaskSourceContext(FIXTURE_SOURCE_CONTEXT)).toBe(true);
    expect(
      isValidTaskSourceContext({
        ...FIXTURE_SOURCE_CONTEXT,
        sourceId: "forged",
      }),
    ).toBe(false);
    expect(
      isValidTaskSourceContext({ ...FIXTURE_SOURCE_CONTEXT, meetingId: "forged" }),
    ).toBe(false);
  });
});
