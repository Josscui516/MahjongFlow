import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ list: vi.fn(), preparation: vi.fn() }));
vi.mock("@/features/tasks/core/service", () => ({ listTasks: mocks.list }));
vi.mock("./service", () => ({ getEventPreparation: mocks.preparation }));
vi.mock("./actions", () => ({ setTaskEventAction: async () => {} }));
vi.mock("./PreparationPanel", () => ({ PreparationPanel: () => null }));
import { EventPreparationSection } from "./EventPreparationSection";

it("requests the next candidate page instead of silently truncating at twenty tasks", async () => {
  mocks.list.mockResolvedValue({ ok: true, items: [], total: 45 });
  const html = renderToStaticMarkup(await EventPreparationSection({ eventId: "fictional-event", candidatePage: 2 }));
  expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ page: 2, pageSize: 20 }));
  expect(html).toContain("candidatePage=1");
  expect(html).toContain("candidatePage=3");
});
it("reports a failed candidate query instead of an empty successful list", async () => {
  mocks.list.mockResolvedValue({ ok: false, code: "SYSTEM_ERROR" });
  const html = renderToStaticMarkup(await EventPreparationSection({ eventId: "fictional-event" }));
  expect(html).toContain('role="alert"');
  expect(html).toContain("Task choices could not be loaded");
});
