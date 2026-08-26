import { describe, expect, it, vi } from "vitest";

import type { TaskConversionCreateInput, TaskSourceContext } from "./contracts";
import { convertTaskSource, resolveTaskSource } from "./service";

const source: TaskSourceContext = {
  meetingId: "30000000-0000-4000-8000-000000000001",
  sourceContent: "Approve the fictional venue booking.",
  sourceId: "32000000-0000-4000-8000-000000000001",
  sourceKind: "decision",
};
const input: TaskConversionCreateInput = {
  assigneeId: "11111111-1111-4111-8111-111111111111",
  description: "Confirm the fictional booking.",
  dueDate: "2026-09-01",
  status: "not_started",
  title: "Confirm venue",
};

describe("task conversion source service", () => {
  it("resolves trusted context from the reader instead of browser-supplied meeting data", async () => {
    const read = vi.fn().mockResolvedValue(source);
    await expect(resolveTaskSource("decision", source.sourceId, { read })).resolves.toEqual(source);
    expect(read).toHaveBeenCalledWith("decision", source.sourceId);
  });

  it("creates one task with the server-resolved source", async () => {
    const read = vi.fn().mockResolvedValue(source);
    const createFromSource = vi.fn().mockResolvedValue({ ok: true, taskId: "task-fictional", source });
    await expect(convertTaskSource("decision", source.sourceId, input, { read }, { createFromSource })).resolves.toMatchObject({ ok: true, taskId: "task-fictional" });
    expect(createFromSource).toHaveBeenCalledTimes(1);
    expect(createFromSource).toHaveBeenCalledWith(source, input);
  });

  it("does not create a partial task when the source is missing", async () => {
    const createFromSource = vi.fn();
    const result = await convertTaskSource("discussion", "31000000-0000-4000-8000-000000000099", input, { read: vi.fn().mockResolvedValue(null) }, { createFromSource });
    expect(result).toMatchObject({ ok: false, code: "source_missing" });
    expect(createFromSource).not.toHaveBeenCalled();
  });

  it("rejects invalid task fields before creating a partial task", async () => {
    const createFromSource = vi.fn();
    const result = await convertTaskSource(
      "decision",
      source.sourceId,
      { ...input, title: " " },
      { read: vi.fn().mockResolvedValue(source) },
      { createFromSource },
    );

    expect(result).toMatchObject({ ok: false, code: "validation", source });
    expect(createFromSource).not.toHaveBeenCalled();
  });

  it("returns the duplicate result from the persistence boundary", async () => {
    const duplicate = { ok: false as const, code: "duplicate" as const, message: "A task already exists for this source.", source };
    const createFromSource = vi.fn().mockResolvedValue(duplicate);

    await expect(convertTaskSource(
      "decision",
      source.sourceId,
      input,
      { read: vi.fn().mockResolvedValue(source) },
      { createFromSource },
    )).resolves.toEqual(duplicate);
    expect(createFromSource).toHaveBeenCalledTimes(1);
  });
});
