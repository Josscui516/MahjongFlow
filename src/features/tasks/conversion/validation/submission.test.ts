import { describe, expect, it, vi } from "vitest";

import type { TaskConversionPort } from "./contracts";
import {
  FIXTURE_ASSIGNEE_ID,
  FIXTURE_SOURCE_CONTEXT,
  FIXTURE_TASK_VALUES,
} from "./fixtures";
import {
  submitTaskConversion,
  submitTaskConversionForm,
} from "./submission";

function portWith(
  createFromSource: TaskConversionPort["createFromSource"],
): TaskConversionPort {
  return { createFromSource };
}

function dependencies(port: TaskConversionPort) {
  return {
    port,
    sourceContext: FIXTURE_SOURCE_CONTEXT,
    validationOptions: { allowedAssigneeIds: [FIXTURE_ASSIGNEE_ID] },
  } as const;
}

describe("task conversion submission boundary", () => {
  it("revalidates C-03 and creates no partial task on failure", async () => {
    const createFromSource = vi.fn();
    const result = await submitTaskConversion(
      dependencies(portWith(createFromSource)),
      { ...FIXTURE_TASK_VALUES, dueDate: "" },
    );

    expect(result.status).toBe("validation");
    expect(result.sourceContext).toBe(FIXTURE_SOURCE_CONTEXT);
    expect(result.values.title).toBe(FIXTURE_TASK_VALUES.title);
    expect(createFromSource).not.toHaveBeenCalled();
  });

  it("passes one complete C-02 draft to the persistence port", async () => {
    const createFromSource = vi.fn(async () => ({
      ok: true as const,
      source: FIXTURE_SOURCE_CONTEXT,
      taskId: "77777777-7777-4777-8777-777777777777",
    }));
    const result = await submitTaskConversion(
      dependencies(portWith(createFromSource)),
      FIXTURE_TASK_VALUES,
    );

    expect(result).toMatchObject({
      sourceContext: FIXTURE_SOURCE_CONTEXT,
      status: "success",
      taskId: "77777777-7777-4777-8777-777777777777",
    });
    expect(createFromSource).toHaveBeenCalledTimes(1);
    expect(createFromSource).toHaveBeenCalledWith(
      FIXTURE_SOURCE_CONTEXT,
      FIXTURE_TASK_VALUES,
    );
  });

  it("rejects repeated FormData assignees before calling persistence", async () => {
    const createFromSource = vi.fn();
    const formData = new FormData();
    for (const [key, value] of Object.entries(FIXTURE_TASK_VALUES)) {
      formData.append(key, value);
    }
    formData.append("assigneeId", "88888888-8888-4888-8888-888888888888");

    const result = await submitTaskConversionForm(
      dependencies(portWith(createFromSource)),
      formData,
    );

    expect(result.status).toBe("validation");
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "ASSIGNEE_INVALID_CARDINALITY" }),
    );
    expect(createFromSource).not.toHaveBeenCalled();
  });

  it("preserves source and fields for duplicate, permission, and system failures", async () => {
    const codes = ["duplicate", "forbidden", "system"] as const;

    for (const code of codes) {
      const result = await submitTaskConversion(
        dependencies(
          portWith(async () => ({
            code,
            message: "Safe fictional failure.",
            ok: false,
            source: FIXTURE_SOURCE_CONTEXT,
          })),
        ),
        FIXTURE_TASK_VALUES,
      );

      expect(result.sourceContext).toBe(FIXTURE_SOURCE_CONTEXT);
      expect(result.values).toEqual(FIXTURE_TASK_VALUES);
      expect(result.status).toBe(
        code === "duplicate"
          ? "duplicate"
          : code === "forbidden"
            ? "permission"
            : "system-error",
      );
    }
  });

  it("maps persistence validation failures back to stable field errors", async () => {
    const result = await submitTaskConversion(
      dependencies(
        portWith(async () => ({
          code: "validation",
          errors: [
            {
              field: "dueDate",
              message: "The due date conflicts with the source meeting.",
            },
          ],
          message: "Review the rejected field.",
          ok: false,
          source: FIXTURE_SOURCE_CONTEXT,
        })),
      ),
      FIXTURE_TASK_VALUES,
    );

    expect(result).toMatchObject({
      errors: [
        {
          code: "FIELD_REJECTED",
          field: "dueDate",
          label: "Due date",
          message: "The due date conflicts with the source meeting.",
        },
      ],
      sourceContext: FIXTURE_SOURCE_CONTEXT,
      status: "validation",
      values: FIXTURE_TASK_VALUES,
    });
  });

  it("uses a visible system state when persistence returns validation without field errors", async () => {
    const result = await submitTaskConversion(
      dependencies(
        portWith(async () => ({
          code: "validation",
          message: "Validation failed without a field.",
          ok: false,
          source: FIXTURE_SOURCE_CONTEXT,
        })),
      ),
      FIXTURE_TASK_VALUES,
    );

    expect(result).toMatchObject({ errors: [], status: "system-error" });
  });

  it("maps thrown private errors and invalid trusted sources to safe system states", async () => {
    const rejectedPort = portWith(
      vi.fn().mockRejectedValue(new Error("private transport detail")),
    );
    await expect(
      submitTaskConversion(dependencies(rejectedPort), FIXTURE_TASK_VALUES),
    ).resolves.toMatchObject({ status: "system-error" });

    const createFromSource = vi.fn();
    const result = await submitTaskConversion(
      {
        ...dependencies(portWith(createFromSource)),
        sourceContext: { ...FIXTURE_SOURCE_CONTEXT, meetingId: "forged" },
      },
      FIXTURE_TASK_VALUES,
    );
    expect(result.status).toBe("system-error");
    expect(createFromSource).not.toHaveBeenCalled();
  });
});
