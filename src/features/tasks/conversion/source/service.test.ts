import { describe, expect, it, vi } from "vitest";

import type { TaskConversionCreateInput, TaskSourceContext } from "./contracts";
import { convertTaskSource, resolveTaskSource } from "./service";

const source: TaskSourceContext = {
  meetingId: "meeting-fictional",
  sourceContent: "Approve the fictional venue booking.",
  sourceId: "decision-fictional",
  sourceKind: "decision",
};
const input: TaskConversionCreateInput = {
  assigneeId: "profile-fictional",
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
    const result = await convertTaskSource("discussion", "missing", input, { read: vi.fn().mockResolvedValue(null) }, { createFromSource });
    expect(result).toMatchObject({ ok: false, code: "source_missing" });
    expect(createFromSource).not.toHaveBeenCalled();
  });
});
