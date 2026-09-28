import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ access: vi.fn(), event: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireBackendUser: mocks.access }));
vi.mock("@/features/events/core/service", () => ({ getEvent: mocks.event }));
vi.mock("@/features/events/preparation/EventPreparationSection", () => ({ EventPreparationSection: () => null }));
vi.mock("@/features/registrations/attendance-summary/EventParticipationSection", () => ({ EventParticipationSection: ({eventId}: {eventId: string}) => <section aria-label="Safe event totals">{eventId}</section> }));
vi.mock("@/features/attendance/tokens", () => ({ EventCheckInTokenSection: ({eventId}: {eventId: string}) => <section aria-label="Secure check-in settings">{eventId}</section> }));
import Page from "./page";
it.each(["authorised", "committee"])("limits the event registration shortcut for %s", async (role) => {
  mocks.access.mockResolvedValue({ role });
  mocks.event.mockResolvedValue({ ok: true, record: { id: "fictional-event", name: "Fictional session", eventType: "weekly_session", status: "scheduled", startsAt: "2026-09-15T08:00:00Z", location: "Test room", description: "Fictional", requiresStudentId: false } });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ eventId: "fictional-event" }), searchParams: Promise.resolve({}) }));
  expect(html.includes('href="/registrations/fictional-event"')).toBe(role === "authorised");
  expect(html).toContain("Starts (Sydney time)");
  expect(html).toContain("Safe event totals");
  expect(html.includes("Secure check-in settings")).toBe(role === "authorised");
});
