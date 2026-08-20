import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createMeetingHistoryFixture } from "./meeting-history.fixture";
import {
  formatMeetingStart,
  MeetingHistoryList,
} from "./MeetingHistoryList";
import {
  MeetingHistoryPageView,
  MeetingHistoryPermissionDeniedView,
  MeetingHistorySystemErrorView,
} from "./MeetingHistoryPageView";

describe("MeetingHistoryList", () => {
  it("renders updated fictional meetings newest-first with detail links", () => {
    const html = renderToStaticMarkup(
      <MeetingHistoryList items={createMeetingHistoryFixture()} />,
    );

    expect(html).toContain('data-history-state="success"');
    expect(html).toContain("Weekly planning recap (updated)");
    expect(html).toContain(
      'href="/meetings/00000000-0000-4000-8000-000000000003"',
    );
    expect(html).toContain('dateTime="2026-08-12T10:30:00.000Z"');
    expect(html).toContain("View record");
    expect(html).toContain("Newest first");
    expect([...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1])).toEqual([
      "/meetings/00000000-0000-4000-8000-000000000003",
      "/meetings/00000000-0000-4000-8000-000000000001",
      "/meetings/00000000-0000-4000-8000-000000000002",
    ]);
    expect(html.indexOf("Committee workflow check")).toBeLessThan(
      html.indexOf("Event preparation review"),
    );
  });

  it("renders a clear empty state instead of a blank list", () => {
    const html = renderToStaticMarkup(<MeetingHistoryList items={[]} />);

    expect(html).toContain('data-feedback-state="empty"');
    expect(html).toContain("No meetings recorded");
  });

  it("formats meeting time using Australia/Sydney semantics", () => {
    expect(formatMeetingStart("2026-08-12T10:30:00.000Z")).toBe(
      "12 Aug 2026, 8:30 pm",
    );
    expect(formatMeetingStart("2026-01-15T10:30:00.000Z")).toBe(
      "15 Jan 2026, 9:30 pm",
    );
  });

  it("does not expose destructive controls", () => {
    const html = renderToStaticMarkup(
      <MeetingHistoryPageView items={createMeetingHistoryFixture()} />,
    );

    expect(html).not.toMatch(/>\s*(delete|archive)\b/i);
    expect(html).not.toMatch(/aria-label="[^"]*(delete|archive)/i);
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<form");
    expect(html).not.toContain('data-method="delete"');
  });

  it("uses fixed denial and system-error views without protected content", () => {
    const deniedHtml = renderToStaticMarkup(
      <MeetingHistoryPermissionDeniedView />,
    );
    const errorHtml = renderToStaticMarkup(<MeetingHistorySystemErrorView />);

    expect(deniedHtml).toContain('data-feedback-state="permission"');
    expect(errorHtml).toContain('data-feedback-state="error"');
    expect(`${deniedHtml}${errorHtml}`).not.toContain(
      "Weekly planning recap",
    );
  });
});
