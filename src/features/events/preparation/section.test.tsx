import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ list: vi.fn(), preparation: vi.fn() }));
vi.mock("@/features/tasks/core/service", () => ({ listTasks: mocks.list }));
vi.mock("./service", () => ({ getEventPreparation: mocks.preparation }));
vi.mock("./actions", () => ({ setTaskEventAction: async () => {} }));
import { EventPreparationSection } from "./EventPreparationSection";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.preparation.mockResolvedValue({ ok: true, snapshot: { eventId: "fictional-event", tasks: [], progress: { completed: 0, total: 0 } } });
});

const task = (id: string) => ({ id, title: `Fictional task ${id}`, dueDate: "2026-10-21", eventId: null, assigneeId: "fictional", description: "Fictional", status: "not_started" as const, createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z", createdBy: "fictional" });

it("loads all task choices across internal query batches without visible pagination", async () => {
  mocks.list.mockResolvedValueOnce({ ok: true, items: Array.from({length: 100}, (_, i) => task(String(i))), total: 101 })
    .mockResolvedValueOnce({ ok: true, items: [task("beyond-first-batch")], total: 101 });
  const html = renderToStaticMarkup(await EventPreparationSection({ eventId: "fictional-event" }));
  expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 100 }));
  expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ page: 2, pageSize: 100 }));
  expect(html).toContain('role="combobox"');
  expect(html).not.toContain("Available tasks");
  expect(html).not.toContain("More tasks");
  expect(html).not.toContain("candidatePage");
});
it("reports a failed candidate query instead of an empty successful list", async () => {
  mocks.list.mockResolvedValue({ ok: false, code: "SYSTEM_ERROR" });
  const html = renderToStaticMarkup(await EventPreparationSection({ eventId: "fictional-event" }));
  expect(html).toContain('role="alert"');
  expect(html).toContain("Task choices could not be loaded");
  expect(html.indexOf('role="alert"')).toBeLessThan(html.indexOf("</section>"));
});

it("hides pagination when all task choices fit on one page", async () => {
  mocks.list.mockResolvedValue({ ok: true, items: [], total: 0 });
  const html = renderToStaticMarkup(await EventPreparationSection({ eventId: "fictional-event" }));
  expect(html).toContain("No preparation tasks yet");
  expect(html).not.toContain('aria-label="Preparation task choices"');
});

it("reports a later batch failure instead of silently offering a partial task list", async () => {
  mocks.list.mockResolvedValueOnce({ ok: true, items: [task("first")], total: 101 })
    .mockResolvedValueOnce({ ok: false, code: "SYSTEM_ERROR" });
  const html = renderToStaticMarkup(await EventPreparationSection({ eventId: "fictional-event" }));
  expect(html).toContain("Task choices could not be loaded");
  expect(html).not.toContain('role="combobox"');
});
