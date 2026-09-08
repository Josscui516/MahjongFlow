import { describe, expect, it } from "vitest";

import {
  TASK_STATUSES,
  type TaskStatus,
} from "@/features/tasks/core/contracts";
import { classifyTaskDueRisk } from "@/features/tasks/due-risk";
import { Constants } from "@/types/database.generated";

const NOW = new Date("2026-09-07T14:00:00.000Z");

const classify = (dueDate: string, status: TaskStatus = "not_started") =>
  classifyTaskDueRisk({ dueDate, now: new Date(NOW), status });

describe("Sydney task due-risk classification", () => {
  it.each([
    ["2026-09-07", "overdue"],
    ["2026-09-08", "dueSoon"],
    ["2026-09-15", "dueSoon"],
    ["2026-09-16", "normal"],
  ] as const)("classifies %s as %s at the T-03 boundary", (dueDate, value) => {
    expect(classify(dueDate)).toEqual({ ok: true, value });
  });

  it("uses the same rules for every unfinished persisted status", () => {
    expect(classify("2026-09-07", "not_started")).toEqual({
      ok: true,
      value: "overdue",
    });
    expect(classify("2026-09-15", "in_progress")).toEqual({
      ok: true,
      value: "dueSoon",
    });
  });

  it("changes calendar day at Sydney midnight rather than at UTC midnight", () => {
    expect(classifyTaskDueRisk({
      dueDate: "2026-08-31",
      now: new Date("2026-08-31T13:59:59.999Z"),
      status: "not_started",
    })).toEqual({ ok: true, value: "dueSoon" });
    expect(classifyTaskDueRisk({
      dueDate: "2026-08-31",
      now: new Date("2026-08-31T14:00:00.000Z"),
      status: "not_started",
    })).toEqual({ ok: true, value: "overdue" });
  });

  it.each([
    {
      daySeven: "2026-10-09",
      dayEight: "2026-10-10",
      name: "DST start",
      now: "2026-10-01T14:30:00.000Z",
    },
    {
      daySeven: "2026-04-11",
      dayEight: "2026-04-12",
      name: "DST end",
      now: "2026-04-03T13:30:00.000Z",
    },
    {
      daySeven: "2028-03-06",
      dayEight: "2028-03-07",
      name: "leap day",
      now: "2028-02-27T13:00:00.000Z",
    },
    {
      daySeven: "2026-02-06",
      dayEight: "2026-02-07",
      name: "month boundary",
      now: "2026-01-29T13:00:00.000Z",
    },
    {
      daySeven: "2027-01-07",
      dayEight: "2027-01-08",
      name: "year boundary",
      now: "2026-12-30T13:00:00.000Z",
    },
  ])("uses calendar-day boundaries through $name", ({ dayEight, daySeven, now }) => {
    expect(classifyTaskDueRisk({
      dueDate: daySeven,
      now: new Date(now),
      status: "in_progress",
    })).toEqual({ ok: true, value: "dueSoon" });
    expect(classifyTaskDueRisk({
      dueDate: dayEight,
      now: new Date(now),
      status: "in_progress",
    })).toEqual({ ok: true, value: "normal" });
  });

  it("removes a task from overdue and unfinished results when it is completed", () => {
    const beforeCompletion = classify("2026-09-07", "in_progress");
    const afterCompletion = classify("2026-09-07", "completed");
    const counts = (result: typeof beforeCompletion) => ({
      overdue: result.ok && result.value === "overdue" ? 1 : 0,
      unfinished: result.ok && result.value !== "completed" ? 1 : 0,
    });

    expect(beforeCompletion).toEqual({ ok: true, value: "overdue" });
    expect(afterCompletion).toEqual({ ok: true, value: "completed" });
    expect(counts(beforeCompletion)).toEqual({ overdue: 1, unfinished: 1 });
    expect(counts(afterCompletion)).toEqual({ overdue: 0, unfinished: 0 });
  });

  it("returns invalid instead of silently classifying malformed input", () => {
    expect(classify("2026-02-30")).toEqual({
      ok: false,
      reason: "INVALID_DUE_DATE",
      value: "invalid",
    });
    expect(classify("2026-02-30", "completed")).toEqual({
      ok: false,
      reason: "INVALID_DUE_DATE",
      value: "invalid",
    });
    expect(classifyTaskDueRisk({
      dueDate: "2026-09-08",
      now: new Date(Number.NaN),
      status: "not_started",
    })).toEqual({
      ok: false,
      reason: "INVALID_NOW",
      value: "invalid",
    });
    expect(classifyTaskDueRisk({
      dueDate: "2026-09-08",
      now: new Date(NOW),
      status: "blocked" as TaskStatus,
    })).toEqual({
      ok: false,
      reason: "INVALID_STATUS",
      value: "invalid",
    });
  });

  it("keeps overdue and dueSoon derived rather than selectable task statuses", () => {
    expect(TASK_STATUSES).toEqual([
      "not_started",
      "in_progress",
      "completed",
    ]);
    expect(TASK_STATUSES).not.toContain("overdue");
    expect(TASK_STATUSES).not.toContain("dueSoon");
    expect(Constants.public.Enums.task_status).toEqual(TASK_STATUSES);
    expect(Constants.public.Enums.task_status).not.toContain("overdue");
  });
});
