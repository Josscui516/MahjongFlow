import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ access: vi.fn(), event: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireBackendUser: mocks.access }));
vi.mock("@/features/events/core/service", () => ({ getEvent: mocks.event }));
vi.mock("@/features/events/preparation/EventPreparationSection", () => ({ EventPreparationSection: () => null }));
vi.mock("@/features/registrations/attendance-summary/EventParticipationSection", () => ({ EventParticipationSection: ({eventId}: {eventId: string}) => <section aria-label="Safe event totals">{eventId}</section> }));
vi.mock("@/features/attendance/tokens", async () => ({
  ...await import("@/features/attendance/tokens/permissions"),
  EventCheckInTokenSection: ({eventId}: {eventId: string}) => <section aria-label="Secure check-in settings">{eventId}</section>,
}));
import Page from "./page";
it.each(["authorised", "committee"])("limits the event registration shortcut for %s", async (role) => {
  mocks.access.mockResolvedValue({ role });
  mocks.event.mockResolvedValue({ ok: true, record: { id: "fictional-event", name: "Fictional session", eventType: "weekly_session", status: "scheduled", startsAt: "2026-09-15T08:00:00Z", location: "Test room", description: "Fictional", requiresStudentId: false } });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ eventId: "fictional-event" }), searchParams: Promise.resolve({}) }));
  expect(html).toContain('href="/registrations/fictional-event"');
  expect(html.includes('href="/attendance/fictional-event"')).toBe(role === "authorised");
  expect(html).toContain('href="/dinner-verification/fictional-event"');
  expect(html).toContain("Starts (Sydney time)");
  expect(html).toContain("Safe event totals");
  expect(html.includes("Secure check-in settings")).toBe(role === "authorised");
});

it("allows an account administrator to manage QR and submit registrations without attendance detail access", async () => {
  mocks.access.mockResolvedValue({ role: "committee", canManageAccounts: true });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ eventId: "fictional-event" }), searchParams: Promise.resolve({}) }));
  expect(html).toContain("Secure check-in settings");
  expect(html).toContain('href="/registrations/fictional-event"');
  expect(html).not.toContain('href="/attendance/fictional-event"');
});

it.each(["completed", "cancelled"])("explains the %s event state instead of showing a generation button or permission error", async status => {
  mocks.access.mockResolvedValue({ role: "authorised", canManageAccounts: true });
  mocks.event.mockResolvedValue({ ok: true, record: { id: "fictional-event", name: "Fictional session", eventType: "weekly_session", status, startsAt: "2026-09-15T08:00:00Z", location: "Test room", description: "Fictional", requiresStudentId: false } });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ eventId: "fictional-event" }), searchParams: Promise.resolve({}) }));
  expect(html).toContain("QR registration is available only for Scheduled events");
  expect(html).not.toContain("Secure check-in settings");
});
