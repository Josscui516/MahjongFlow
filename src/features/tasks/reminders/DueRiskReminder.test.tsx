import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { DueRiskResult } from "../due-risk";
import { DueRiskReminder } from "./DueRiskReminder";

const taskTitle = "Confirm fictional venue booking";
const taskHref = "/tasks/00000000-0000-4000-8000-000000000022";
const render = (risk: DueRiskResult, href: `/tasks/${string}` | undefined = taskHref) =>
  renderToStaticMarkup(<DueRiskReminder risk={risk} taskTitle={taskTitle} taskHref={href} />);

describe("DueRiskReminder", () => {
  it.each([
    ["overdue", "Overdue", "Past its due date"],
    ["dueSoon", "Due soon", "Due today or within 7 days"],
  ] as const)("renders %s with visible text and a decorative icon", (value, label, detail) => {
    const html = render({ ok: true, value });
    expect(html).toContain(label);
    expect(html).toContain(detail);
    expect(html).toContain("Sydney time");
    expect(html).toContain('<svg aria-hidden="true" focusable="false"');
    expect(html).toContain(`href="${taskHref}"`);
    expect(html).toContain(`Open task: ${taskTitle} — ${label}`);
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("aria-label="); // Visible link text is its accessible name.
  });

  it("uses different icon shapes for due soon and overdue", () => {
    expect(render({ ok: true, value: "overdue" })).toContain('d="m12 3 10 18H2Z"');
    expect(render({ ok: true, value: "dueSoon" })).toContain('d="M12 7v5l3 2"');
  });

  it.each(["normal", "completed"] as const)("does not warn for %s", (value) => {
    expect(render({ ok: true, value })).toBe("");
  });

  it.each(["INVALID_DUE_DATE", "INVALID_NOW", "INVALID_STATUS", "UNSUPPORTED_TIME_ZONE"] as const)(
    "shows safe, explicit feedback for %s without exposing diagnostic values", (reason) => {
      const html = render({ ok: false, value: "invalid", reason });
      expect(html).toContain("Due status unavailable");
      expect(html).not.toContain(reason);
      expect(html).not.toContain("Overdue");
      expect(html).not.toContain("Due soon");
    },
  );

  it("keeps an unavailable task link as non-interactive context", () => {
    const html = renderToStaticMarkup(<DueRiskReminder risk={{ ok: true, value: "overdue" }} taskTitle={taskTitle} />);
    expect(html).toContain(`Task: ${taskTitle}`);
    expect(html).not.toContain("href=");
  });

  it.each(["https://example.invalid", "javascript:alert(1)", "//example.invalid", "/tasks/", "/tasks/../dashboard"])(
    "does not activate a malformed or external link: %s", (href) => {
      expect(render({ ok: true, value: "overdue" }, href as `/tasks/${string}`)).not.toContain("href=");
    },
  );

  it("escapes titles without truncating long content", () => {
    const title = '<script>alert("fictional")</script>' + "LongFictionalTitle".repeat(30);
    const html = renderToStaticMarkup(<DueRiskReminder risk={{ ok: true, value: "dueSoon" }} taskTitle={title} />);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("LongFictionalTitle".repeat(30));
  });
});

it("keeps compact reminders contextual without repeating the task title", () => {
 const html = renderToStaticMarkup(<DueRiskReminder compact now={new Date("2026-09-15T00:00:00Z")} dueDate="2026-09-14" risk={{ok:true,value:"overdue"}} taskTitle="Fictional task" />);
 expect(html).toContain("Overdue 1 day");
 expect(html).not.toContain("Task: Fictional task");
 expect(html).not.toContain("Past its due date");
});
it("uses Sydney calendar days across midnight for compact copy", () => {
 const html = renderToStaticMarkup(<DueRiskReminder compact now={new Date("2026-09-14T14:30:00Z")} dueDate="2026-09-15" risk={{ok:true,value:"dueSoon"}} taskTitle="Fictional task" />);
 expect(html).toContain("Due today");
});
