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
  it("combines workspace actions with task and event summaries in one dashboard", () => {
    const html = renderToStaticMarkup(<DashboardView snapshot={snapshot} upcomingEvents={{ events: [], state: "ready" }} />);
    expect(html).toContain('aria-label="Quick actions"');
    expect(html).toContain('href="/meetings/new"');
    expect(html).toContain('href="/tasks/new"');
    expect(html).toContain('href="/events/new"');
    expect(html).toContain("My unfinished tasks");
    expect(html).toContain("No upcoming events.");
    expect(html).not.toContain("Committee dashboard");
  });
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

it.each(["mine", "unfinished"] as const)("retains every %s task behind a bounded preview and preserves the accurate total", (key) => {
 const items = Array.from({length:5}, (_,i) => ({id:`fixture-${i}`,title:`Fictional task ${i}`,dueDate:"2026-09-09",status:"not_started" as const,assigneeId:"fixture-owner",description:"Fixture",eventId:null,createdBy:"fixture-owner",createdAt:"2026-09-09T00:00:00Z",updatedAt:"2026-09-09T00:00:00Z",sourceMeetingId:null,sourceDecisionId:null,sourceDiscussionPointId:null}));
 const html = renderToStaticMarkup(<DashboardView snapshot={{...snapshot,sections:[{ok:true,section:{items,key,total:5}}]}} upcomingEvents={{state:"not_connected"}} />);
 expect(html).toContain("Show 2 more tasks");
 const disclosure = html.indexOf("<details");
 expect(html.indexOf("Fictional task 2")).toBeLessThan(disclosure);
 expect(html).not.toContain("Fictional task 3");
 expect(html).not.toContain("Fictional task 4");
 expect(html).toContain(`href="#dashboard-${key}"`);
});

it("places task groups ahead of the supporting events panel while preserving independent error states", () => {
  const html = renderToStaticMarkup(<DashboardView snapshot={snapshot} upcomingEvents={{state:"ready",events:[]}} />);
  expect(html.indexOf('id="dashboard-mine"')).toBeLessThan(html.indexOf('id="upcoming-events-heading"'));
  expect(html).toContain("This task summary could not be loaded.");
  expect(html).toContain("There are no unfinished committee tasks.");
});

const emptySnapshot: DashboardSnapshot = {
  ...snapshot,
  sections: (["mine", "overdue", "dueSoon", "unfinished"] as const).map(key => ({ok: true, section: {key, items: [], total: 0}})),
};

it("retains four accessible tabs and honest empty states with every summary anchor", () => {
  const html = renderToStaticMarkup(<DashboardView snapshot={emptySnapshot} upcomingEvents={{state:"ready",events:[]}} />);
  expect(html).toContain("Task overview");
  expect(html).toContain("You have no unfinished tasks.");
  expect(html.match(/role="tab"/g)).toHaveLength(4);
  expect(html.match(/role="tabpanel"/g)).toHaveLength(4);
  expect(html.match(/hidden=""/g)).toHaveLength(3);
  expect(html).toContain('id="tab-mine" aria-selected="true"');
  for (const key of ["mine", "overdue", "dueSoon", "unfinished"]) {
    expect(html).toContain(`href="#dashboard-${key}"`);
    expect(html).toContain(`id="dashboard-${key}"`);
  }
  expect(html).not.toContain("bg-rose-50");
  expect(html).not.toContain("View task overview");
});

it("keeps permission failures visible rather than presenting an all-clear state", () => {
  const html = renderToStaticMarkup(<DashboardView snapshot={{...emptySnapshot, sections: [...emptySnapshot.sections.filter(result => result.ok && result.section.key !== "overdue"), {ok:false,key:"overdue",code:"PERMISSION_DENIED"}]}} upcomingEvents={{state:"error"}} />);
  expect(html).not.toContain("No unfinished tasks");
  expect(html).toContain("You do not have permission to view this task summary.");
  expect(html).toContain("Unavailable");
  expect(html).not.toContain("bg-rose-50");
});

it("uses warning color only for confirmed overdue tasks", () => {
  const html = renderToStaticMarkup(<DashboardView snapshot={{...snapshot, sections:[{ok:true,section:{key:"overdue",items:[],total:1}}]}} upcomingEvents={{state:"not_connected"}} />);
  expect(html).toContain("bg-rose-50");
  expect(html).not.toContain("View tasks");
  expect(html).toContain('aria-controls="dashboard-overdue"');
});
