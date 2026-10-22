import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/features/meetings/editor/actions", () => ({
  deleteMeetingAction: vi.fn(),
}));

import { createMeetingHistoryFixture } from "./meeting-history.fixture";
import { MeetingHistorySort } from "./MeetingHistorySort";
import { MeetingHistoryFilters } from "./MeetingHistoryFilters";
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
  it("shows ten meetings on page two and retains filters in pagination", () => {
    const criteria = { ...DEFAULT_CRITERIA, page: 2, pageSize: 10, search: "planning" };
    const template = createMeetingHistoryFixture()[0];
    const items = Array.from({ length: 10 }, (_, index) => ({ ...template, id: `fictional-${index}` }));
    const html = renderToStaticMarkup(<MeetingHistoryList criteria={criteria} result={{ items, page: 2, pageCount: 3, pageSize: 10, totalCount: 21 }} />);
    expect(html).toContain("Showing 11–20 of 21");
    expect(html.match(/<article /g)).toHaveLength(10);
    expect(html).toContain('href="/meetings?q=planning&amp;page=3"');
  });
  it("connects the external automatic sort to the filters without an Apply button", () => {
    const html = renderToStaticMarkup(<><MeetingHistoryFilters criteria={{ ...DEFAULT_CRITERIA, search: "planning", time: "past", sort: "oldest" }} /><MeetingHistorySort criteria={{...DEFAULT_CRITERIA,sort:"oldest"}} /></>);
    expect(html).not.toContain('type="submit"');
    expect(html).toContain('value="planning"');
    expect(html).toContain('value="past" selected=""');
    expect(html).toContain('value="oldest" selected=""');
    expect(html).toContain('href="/meetings"');
    expect(html).toContain("Clear all");
    expect(html).toContain('aria-label="Active meeting filters"');
    expect(html).toContain("Search: planning");
    expect(html).toContain("Meeting date: Past");
    expect(renderToStaticMarkup(<MeetingHistoryFilters criteria={DEFAULT_CRITERIA} />)).not.toContain("Active meeting filters");
  });
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
    expect(html).toContain('form="meeting-filters"');
    expect(html).toContain('value="newest" selected=""');
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
    expect(html).toContain("Create your first meeting");
    expect(html).toContain('href="/meetings/new"');
    expect(html).not.toContain('name="q"');
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
    expect(filteredEmptyHtml).toContain("Meeting date");
    expect(filteredEmptyHtml).toContain('name="q"');
    expect(filteredEmptyHtml).not.toContain("or sort order");
    expect(filteredEmptyHtml).not.toContain("Create your first meeting");
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
    expect(html).not.toContain("<details");
    expect(html).not.toContain("More actions for");
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
