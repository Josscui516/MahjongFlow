import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const taskMocks = vi.hoisted(() => ({ getTask: vi.fn() }));
const sourceNavigationMocks = vi.hoisted(() => ({ readTaskSource: vi.fn() }));

vi.mock("@/features/tasks/core/service", () => taskMocks);
vi.mock("@/features/tasks/source-navigation/service", () => sourceNavigationMocks);

import TaskPage from "@/app/(dashboard)/tasks/[taskId]/page";

const taskId = "22222222-2222-4222-8222-222222222222";
const meetingId = "33333333-3333-4333-8333-333333333333";
const decisionId = "44444444-4444-4444-8444-444444444444";
const task = {
  assigneeId: "11111111-1111-4111-8111-111111111111",
  createdAt: "2026-08-26T00:00:00.000Z",
  createdBy: "11111111-1111-4111-8111-111111111111",
  description: "Confirm the fictional venue booking.",
  dueDate: "2026-09-01",
  id: taskId,
  sourceDecisionId: decisionId,
  sourceMeetingId: meetingId,
  status: "not_started" as const,
  title: "Confirm fictional booking",
  updatedAt: "2026-08-26T00:00:00.000Z",
};

describe("task source navigation route", () => {
  beforeEach(() => {
    taskMocks.getTask.mockReset();
    sourceNavigationMocks.readTaskSource.mockReset();
    taskMocks.getTask.mockResolvedValue({ ok: true, record: task });
    sourceNavigationMocks.readTaskSource.mockResolvedValue({
      ok: true,
      source: {
        meetingId,
        meetingTitle: "Fictional planning meeting",
        sourceContent: "Approve the fictional venue booking.",
        sourceKind: "decision",
      },
    });
  });

  it("renders task-to-meeting source context and a descriptive return link", async () => {
    const html = renderToStaticMarkup(
      await TaskPage({
        params: Promise.resolve({ taskId }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(sourceNavigationMocks.readTaskSource).toHaveBeenCalledWith(task);
    expect(html).toContain("Fictional planning meeting");
    expect(html).toContain("Approve the fictional venue booking.");
    expect(html).toContain('href="/meetings/33333333-3333-4333-8333-333333333333"');
    expect(html).toContain("Return to source meeting Fictional planning meeting");
  });

  it("uses non-enumerating feedback when the source is missing or inaccessible", async () => {
    sourceNavigationMocks.readTaskSource.mockResolvedValue({
      code: "UNAVAILABLE",
      ok: false,
    });

    const html = renderToStaticMarkup(
      await TaskPage({
        params: Promise.resolve({ taskId }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("Source information unavailable");
    expect(html).not.toContain("Fictional planning meeting");
    expect(html).not.toContain(`href="/meetings/${meetingId}"`);
  });

  it("does not query source details when direct task access is denied", async () => {
    taskMocks.getTask.mockResolvedValue({ code: "PERMISSION_DENIED", ok: false });

    const html = renderToStaticMarkup(
      await TaskPage({
        params: Promise.resolve({ taskId }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("This task is unavailable.");
    expect(html).not.toContain("Confirm fictional booking");
    expect(sourceNavigationMocks.readTaskSource).not.toHaveBeenCalled();
  });
});
