import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/features/meetings/editor/actions", () => ({
  deleteMeetingAction: vi.fn(),
}));

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

const DEFAULT_CRITERIA = {
  page: 1,
  pageSize: 8,
  search: "",
  sort: "newest",
  time: "all",
} as const;

function result(items = createMeetingHistoryFixture(), totalCount = items.length) {
  return {
    items,
    page: 1,
    pageCount: Math.max(1, Math.ceil(totalCount / 8)),
    pageSize: 8,
    totalCount,
  };
}

describe("MeetingHistoryList", () => {
  it("renders updated fictional meetings newest-first with detail links", () => {
    const html = renderToStaticMarkup(
      <MeetingHistoryList criteria={DEFAULT_CRITERIA} result={result()} />,
    );

    expect(html).toContain('data-history-state="success"');
    expect(html).toContain("Weekly planning recap (updated)");
    expect(html).toContain(
      'href="/meetings/00000000-0000-4000-8000-000000000003"',
    );
    expect(html).toContain('dateTime="2026-08-12T10:30:00.000Z"');
    expect(html).toContain("Open meeting");
    expect(html).toContain("Sorted by date · newest first");
    expect([...new Set([...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]))]).toEqual([
      "/meetings/00000000-0000-4000-8000-000000000003",
      "/meetings/00000000-0000-4000-8000-000000000001",
      "/meetings/00000000-0000-4000-8000-000000000002",
    ]);
    expect(html.indexOf("Committee workflow check")).toBeLessThan(
      html.indexOf("Event preparation review"),
    );
  });

  it("renders a clear empty state instead of a blank list", () => {
    const html = renderToStaticMarkup(
      <MeetingHistoryList criteria={DEFAULT_CRITERIA} result={result([])} />,
    );

    expect(html).toContain('data-feedback-state="empty"');
    expect(html).toContain("No meetings recorded");
  });

  it("renders filter-specific empty feedback and pagination links", () => {
    const filteredCriteria = {
      ...DEFAULT_CRITERIA,
      page: 2,
      search: "planning",
      time: "past",
    } as const;
    const filteredEmptyHtml = renderToStaticMarkup(
      <MeetingHistoryList
        criteria={{ ...filteredCriteria, page: 1 }}
        result={result([])}
      />,
    );
    const pagedHtml = renderToStaticMarkup(
      <MeetingHistoryList
        criteria={filteredCriteria}
        result={{
          ...result(createMeetingHistoryFixture(), 24),
          page: 2,
          pageCount: 3,
        }}
      />,
    );

    expect(filteredEmptyHtml).toContain("No matching meetings");
    expect(filteredEmptyHtml).toContain("Clear search and filters");
    expect(pagedHtml).toContain(
      'href="/meetings?q=planning&amp;time=past"',
    );
    expect(pagedHtml).toContain(
      'href="/meetings?q=planning&amp;time=past&amp;page=3"',
    );
  });

  it("formats meeting time using Australia/Sydney semantics", () => {
    expect(formatMeetingStart("2026-08-12T10:30:00.000Z")).toBe(
      "12 Aug 2026, 8:30 pm",
    );
    expect(formatMeetingStart("2026-01-15T10:30:00.000Z")).toBe(
      "15 Jan 2026, 9:30 pm",
    );
  });

  it("provides explicit delete controls and confirmation copy", () => {
    const html = renderToStaticMarkup(
      <MeetingHistoryPageView
        criteria={DEFAULT_CRITERIA}
        result={result()}
      />,
    );

    expect(html).toContain("Delete");
    expect(html).toContain("Delete meeting?");
    expect(html).toContain("This action cannot be undone.");
    expect(html).toContain("participants, discussion points, and key decisions");
    expect(html).not.toContain('data-method="delete"');
  });

  it("shows a deletion success state returned through the history URL", () => {
    const html = renderToStaticMarkup(
      <MeetingHistoryPageView
        criteria={DEFAULT_CRITERIA}
        meetingDeleted
        result={result()}
      />,
    );

    expect(html).toContain("Meeting deleted");
    expect(html).toContain("permanently deleted");
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
