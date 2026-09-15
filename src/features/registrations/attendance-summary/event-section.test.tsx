import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const get = vi.hoisted(() => vi.fn());
vi.mock("./service", () => ({ participationSummaryService: { get } }));
import { EventParticipationSection } from "./EventParticipationSection";

it("renders independent safe event totals without participant identity", async () => {
  get.mockResolvedValue({ ok: true, registrationCount: 0, confirmedAttendanceCount: 2 });
  const html = renderToStaticMarkup(await EventParticipationSection({ eventId: "fictional-event" }));
  expect(get).toHaveBeenCalledWith("fictional-event");
  expect(html).toContain('data-testid="registered-count">0');
  expect(html).toContain('data-testid="attendance-count">2');
});
it("keeps unavailable totals distinct from zero", async () => {
  get.mockResolvedValue({ ok: false, code: "SYSTEM_ERROR" });
  const html = renderToStaticMarkup(await EventParticipationSection({ eventId: "fictional-event" }));
  expect(html).toContain('role="alert"');
  expect(html).not.toContain('data-testid="registered-count"');
});
