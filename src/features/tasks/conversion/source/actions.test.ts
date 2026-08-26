import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const persistenceMocks = vi.hoisted(() => ({
  createTaskConversionPort: vi.fn(),
  createTaskSourceReader: vi.fn(),
}));

vi.mock("./persistence", () => persistenceMocks);

import { convertTaskSourceAction } from "./actions";

describe("task conversion server action boundary", () => {
  beforeEach(() => {
    persistenceMocks.createTaskConversionPort.mockReset();
    persistenceMocks.createTaskSourceReader.mockReset();
  });

  it("rejects an unrecognised source kind without creating persistence adapters", async () => {
    const result = await convertTaskSourceAction(
      "event" as never,
      "32000000-0000-4000-8000-000000000001",
      {
        assigneeId: "11111111-1111-4111-8111-111111111111",
        description: "Confirm the fictional booking.",
        dueDate: "2026-09-01",
        status: "not_started",
        title: "Confirm venue",
      },
    );

    expect(result).toMatchObject({ ok: false, code: "source_missing" });
    expect(persistenceMocks.createTaskSourceReader).not.toHaveBeenCalled();
    expect(persistenceMocks.createTaskConversionPort).not.toHaveBeenCalled();
  });

  it("rejects malformed task data before touching the database boundary", async () => {
    const result = await convertTaskSourceAction(
      "decision",
      "32000000-0000-4000-8000-000000000001",
      null as never,
    );

    expect(result).toMatchObject({ ok: false, code: "validation" });
    expect(persistenceMocks.createTaskSourceReader).not.toHaveBeenCalled();
    expect(persistenceMocks.createTaskConversionPort).not.toHaveBeenCalled();
  });
});
