import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UpcomingEventsPanel } from "./UpcomingEventsPanel";

describe("UpcomingEventsPanel", () => {
  it("renders real events in Sydney time without exposing additional fields", () => {
    const html = renderToStaticMarkup(<UpcomingEventsPanel result={{ events: [{ id: "event-1", location: "Fictional Hall", name: "Fictional event", startsAt: "2026-10-03T16:00:00.000Z" }], state: "ready" }}/>)
    expect(html).toContain("4 Oct 2026"); expect(html).toContain("3:00 am"); expect(html).toContain("Fictional Hall");
  });

  it("keeps empty, permission, and system failures distinct", () => {
    expect(renderToStaticMarkup(<UpcomingEventsPanel result={{ events: [], state: "ready" }}/>)).toContain("No upcoming events");
    expect(renderToStaticMarkup(<UpcomingEventsPanel result={{ state: "permission_denied" }}/>)).toContain("do not have permission");
    expect(renderToStaticMarkup(<UpcomingEventsPanel result={{ state: "error" }}/>)).toContain("could not be loaded");
  });
});
