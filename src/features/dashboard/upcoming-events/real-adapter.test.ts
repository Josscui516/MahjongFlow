import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createRealUpcomingEventsPort } from "./real-adapter";

const now = new Date("2026-09-10T10:00:00.000Z");
describe("real upcoming Dashboard adapter", () => {
  it("maps ordered events and a real empty set to ready", async () => {
    const event = { id: "event-1", location: "Fictional Hall", name: "Fictional event", startsAt: now.toISOString() };
    await expect(createRealUpcomingEventsPort(async () => ({ items: [event], ok: true })).listUpcoming(now)).resolves.toEqual({ events: [event], state: "ready" });
    await expect(createRealUpcomingEventsPort(async () => ({ items: [], ok: true })).listUpcoming(now)).resolves.toEqual({ events: [], state: "ready" });
  });

  it("maps permission and provider failures without leaking details", async () => {
    await expect(createRealUpcomingEventsPort(async () => ({ code: "PERMISSION_DENIED", ok: false })).listUpcoming(now)).resolves.toEqual({ state: "permission_denied" });
    await expect(createRealUpcomingEventsPort(async () => ({ code: "SYSTEM_ERROR", ok: false })).listUpcoming(now)).resolves.toEqual({ state: "error" });
  });
});
