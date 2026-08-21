import type {
  MeetingHistoryCriteria,
  MeetingHistorySort,
  MeetingHistoryTimeFilter,
} from "./contracts";

export const MEETING_HISTORY_PAGE_SIZE = 8;
export const MAX_MEETING_HISTORY_SEARCH_LENGTH = 100;

export type MeetingHistorySearchParams = Readonly<
  Record<string, string | string[] | undefined>
>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10_000) : 1;
}

function parseTime(value: string | undefined): MeetingHistoryTimeFilter {
  return value === "past" || value === "upcoming" ? value : "all";
}

function parseSort(value: string | undefined): MeetingHistorySort {
  return value === "oldest" ? "oldest" : "newest";
}

export function parseMeetingHistorySearchParams(
  params: MeetingHistorySearchParams,
): MeetingHistoryCriteria {
  return {
    page: parsePage(firstValue(params.page)),
    pageSize: MEETING_HISTORY_PAGE_SIZE,
    search: (firstValue(params.q) ?? "")
      .trim()
      .slice(0, MAX_MEETING_HISTORY_SEARCH_LENGTH),
    sort: parseSort(firstValue(params.sort)),
    time: parseTime(firstValue(params.time)),
  };
}

export function buildMeetingHistoryHref(
  criteria: MeetingHistoryCriteria,
  page = criteria.page,
) {
  const params = new URLSearchParams();

  if (criteria.search) params.set("q", criteria.search);
  if (criteria.time !== "all") params.set("time", criteria.time);
  if (criteria.sort !== "newest") params.set("sort", criteria.sort);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/meetings?${query}` : "/meetings";
}

export function hasMeetingHistoryFilters(criteria: MeetingHistoryCriteria) {
  return (
    criteria.search.length > 0 ||
    criteria.time !== "all" ||
    criteria.sort !== "newest"
  );
}
