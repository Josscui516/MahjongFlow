import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const get = vi.hoisted(() => vi.fn());
const dinner = vi.hoisted(() => vi.fn());
vi.mock("@/features/dinner-verification/server", () => ({ readDinnerEligibilityCount: dinner }));
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

it("shows the dinner checklist count and keeps unavailable separate from zero", async () => {
  get.mockResolvedValue({ ok: true, registrationCount: 4, confirmedAttendanceCount: 3 });
  dinner.mockResolvedValueOnce(2).mockResolvedValueOnce(null);
  const html = renderToStaticMarkup(await EventParticipationSection({ eventId: "fictional-event" }));
  expect(html).toContain("Participation overview");
  expect(html).toContain("Dinner Eligibility");
  expect(html).toContain('data-testid="dinner-eligibility-count">2');
  const failed = renderToStaticMarkup(await EventParticipationSection({ eventId: "fictional-event" }));
  expect(failed).toContain("Unavailable");
});
it("always uses the safe dinner aggregate for the event overview", async () => {
  dinner.mockClear();
  dinner.mockResolvedValue(0);
  const html = renderToStaticMarkup(await EventParticipationSection({ eventId: "fictional-event" }));
  expect(dinner).toHaveBeenCalledWith("fictional-event");
  expect(html).toContain('data-testid="dinner-eligibility-count">0');
});
