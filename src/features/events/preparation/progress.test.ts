import { describe, expect, it } from "vitest";
import { calculateEventPreparationProgress } from "./progress";

describe("event preparation progress", () => {
  it("reports E-04 progress as completed over total", () => {
    expect(calculateEventPreparationProgress([{ status: "completed" }, { status: "in_progress" }, { status: "completed" }])).toEqual({ completed: 2, total: 3 });
  });

  it("reports 0/0 without division", () => {
    expect(calculateEventPreparationProgress([])).toEqual({ completed: 0, total: 0 });
  });
});

