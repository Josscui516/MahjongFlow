import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { classifyTaskDueRisk } from "@/features/tasks/due-risk";
import { DueRiskReminder } from "@/features/tasks/reminders";

const now = new Date("2026-09-08T02:00:00Z");

describe("classifier to reminder integration (candidate PR #71 provider)", () => {
  it.each([
    ["2026-09-07", "Overdue"],
    ["2026-09-08", "Due soon"],
    ["2026-09-15", "Due soon"],
    ["2026-09-16", ""],
    ["2026-02-30", "Due status unavailable"],
  ])("presents shared classification for %s without recalculating", (dueDate, label) => {
    const risk = classifyTaskDueRisk({ dueDate, status: "not_started", now });
    const html = renderToStaticMarkup(<DueRiskReminder risk={risk} taskTitle="Fictional task" />);
    if (label) expect(html).toContain(label);
    else expect(html).toBe("");
  });

  it("removes the reminder when the host supplies a refreshed completed result", () => {
    const props = { dueDate: "2026-09-07", now };
    const before = classifyTaskDueRisk({ ...props, status: "in_progress" });
    const after = classifyTaskDueRisk({ ...props, status: "completed" });
    expect(renderToStaticMarkup(<DueRiskReminder risk={before} taskTitle="Fictional task" />)).toContain("Overdue");
    expect(renderToStaticMarkup(<DueRiskReminder risk={after} taskTitle="Fictional task" />)).toBe("");
  });

  it("uses the same caller-owned Sydney midnight snapshot in both host compositions", () => {
    const risk = classifyTaskDueRisk({ dueDate: "2026-09-08", status: "in_progress", now: new Date("2026-09-08T14:00:00Z") });
    const reminder = <DueRiskReminder risk={risk} taskTitle="Fictional task" taskHref="/tasks/00000000-0000-4000-8000-000000000022" />;
    const taskList = renderToStaticMarkup(<ul><li>{reminder}</li></ul>);
    const dashboard = renderToStaticMarkup(<section>{reminder}</section>);
    expect(taskList).toContain("Overdue");
    expect(dashboard).toContain("Overdue");
    // These compositions prove the component contract, not real page mounting.
  });
});
