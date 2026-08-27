import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const source = {
  meetingId: "22222222-2222-4222-8222-222222222222",
  sourceContent: "Approve the fictional venue.",
  sourceId: "33333333-3333-4333-8333-333333333333",
  sourceKind: "decision" as const,
};

const mocks = vi.hoisted(() => ({
  createFromSource: vi.fn(),
  listAssigneeOptions: vi.fn(),
  readSource: vi.fn(),
}));

vi.mock("../../editor/server", () => ({
  listAssigneeOptions: mocks.listAssigneeOptions,
}));

vi.mock("../source/persistence", () => ({
  createTaskConversionPort: () => ({ createFromSource: mocks.createFromSource }),
  createTaskSourceReader: () => ({ read: mocks.readSource }),
}));

import { submitTaskConversionAction } from "./actions";
import type { TaskConversionFormValues } from "./contracts";
import { createInitialTaskConversionState } from "./submission";

const values: TaskConversionFormValues = {
  assigneeId: "11111111-1111-4111-8111-111111111111",
  description: "Confirm the fictional booking.",
  dueDate: "2026-09-04",
  status: "not_started",
  title: "Confirm fictional venue",
};

function formData(overrides: Partial<typeof values> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...values, ...overrides })) {
    data.set(key, value);
  }
  return data;
}

describe("integrated task conversion action", () => {
  beforeEach(() => {
    mocks.createFromSource.mockReset();
    mocks.listAssigneeOptions.mockReset();
    mocks.readSource.mockReset();
    mocks.readSource.mockResolvedValue(source);
    mocks.listAssigneeOptions.mockResolvedValue([
      { id: values.assigneeId, label: "Alex Example" },
    ]);
  });

  it("re-reads trusted source and assignees before creating a valid task", async () => {
    mocks.createFromSource.mockResolvedValue({
      ok: true,
      source,
      taskId: "77777777-7777-4777-8777-777777777777",
    });

    const result = await submitTaskConversionAction(
      "decision",
      source.sourceId,
      createInitialTaskConversionState(source, values),
      formData(),
    );

    expect(result).toMatchObject({ status: "success" });
    expect(mocks.readSource).toHaveBeenCalledWith("decision", source.sourceId);
    expect(mocks.createFromSource).toHaveBeenCalledWith(source, values);
  });

  it("rejects missing required fields before persistence", async () => {
    const result = await submitTaskConversionAction(
      "decision",
      source.sourceId,
      createInitialTaskConversionState(source, values),
      formData({ dueDate: "" }),
    );

    expect(result).toMatchObject({ status: "validation" });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "DUE_DATE_REQUIRED" }),
    );
    expect(mocks.createFromSource).not.toHaveBeenCalled();
  });

  it("does not write when the trusted source no longer exists", async () => {
    mocks.readSource.mockResolvedValue(null);

    const result = await submitTaskConversionAction(
      "decision",
      source.sourceId,
      createInitialTaskConversionState(source, values),
      formData(),
    );

    expect(result).toMatchObject({ status: "system-error" });
    expect(mocks.createFromSource).not.toHaveBeenCalled();
  });
});
