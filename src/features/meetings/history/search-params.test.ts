import { describe, expect, it } from "vitest";

import {
  buildMeetingHistoryHref,
  parseMeetingHistorySearchParams,
} from "./search-params";

describe("meeting history search params", () => {
  it("normalises search, filter, sort, and page values", () => {
    expect(
      parseMeetingHistorySearchParams({
        page: "3",
        q: "  planning  ",
        sort: "oldest",
        time: "upcoming",
      }),
    ).toEqual({
      page: 3,
      pageSize: 8,
      search: "planning",
      sort: "oldest",
      time: "upcoming",
    });
  });

  it("falls back safely for malformed values", () => {
    expect(
      parseMeetingHistorySearchParams({
        page: "not-a-page",
        sort: "random",
        time: "future-ish",
      }),
    ).toEqual({
      page: 1,
      pageSize: 8,
      search: "",
      sort: "newest",
      time: "all",
    });
  });

  it("preserves active criteria in pagination links", () => {
    expect(
      buildMeetingHistoryHref(
        {
          page: 2,
          pageSize: 8,
          search: "event planning",
          sort: "oldest",
          time: "past",
        },
        3,
      ),
    ).toBe(
      "/meetings?q=event+planning&time=past&sort=oldest&page=3",
    );
  });
});
