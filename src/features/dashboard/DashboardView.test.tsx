import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { DashboardSnapshot } from "./contracts";
import { DashboardView } from "./DashboardView";

const snapshot: DashboardSnapshot = {
  capturedAt: "2026-09-09T01:00:00.000Z",
  sections: [
    { ok: true, section: { items: [], key: "mine", total: 0 } },
    { ok: true, section: { items: [], key: "unfinished", total: 0 } },
    { ok: false, key: "dueSoon", code: "UPSTREAM_NOT_CONNECTED" },
    { ok: false, key: "overdue", code: "SYSTEM_ERROR" },
  ],
};

describe("DashboardView", () => {
  it("renders independent empty, unavailable, and error states without invented counts", () => {
    const html = renderToStaticMarkup(<DashboardView snapshot={snapshot} upcomingEvents={{ state: "not_connected" }} />);
    expect(html).toContain("You have no unfinished tasks.");
    expect(html).toContain("There are no unfinished committee tasks.");
    expect(html).toContain("Task summaries are waiting for the shared task query provider.");
    expect(html).toContain("This task summary could not be loaded.");
    expect(html).toContain("Upcoming events are not connected yet.");
    expect(html).not.toContain("0 upcoming events");
  });

  it("distinguishes a real empty upcoming result from an unconnected provider", () => {
    const html = renderToStaticMarkup(<DashboardView snapshot={snapshot} upcomingEvents={{ events: [], state: "ready" }} />);
    expect(html).toContain("No upcoming events.");
    expect(html).not.toContain("Sprint 6 will replace");
  });
});

it("retains every task behind a bounded preview and preserves the accurate total", () => {
 const items = Array.from({length:5}, (_,i) => ({id:`fixture-${i}`,title:`Fictional task ${i}`,dueDate:"2026-09-09",status:"not_started" as const,assigneeId:"fixture-owner",description:"Fixture",eventId:null,createdBy:"fixture-owner",createdAt:"2026-09-09T00:00:00Z",updatedAt:"2026-09-09T00:00:00Z",sourceMeetingId:null,sourceDecisionId:null,sourceDiscussionPointId:null}));
 const html = renderToStaticMarkup(<DashboardView snapshot={{...snapshot,sections:[{ok:true,section:{items,key:"mine",total:5}}]}} upcomingEvents={{state:"not_connected"}} />);
 expect(html).toContain("View all 5 tasks");
 const disclosure = html.indexOf("<details");
 expect(html.indexOf("Fictional task 2")).toBeLessThan(disclosure);
 expect(html.indexOf("Fictional task 3")).toBeGreaterThan(disclosure);
 expect(html).toContain("Fictional task 4");
 expect(html).toContain('href="#dashboard-mine"');
});
