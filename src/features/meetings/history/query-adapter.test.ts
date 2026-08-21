import { describe, expect, it } from "vitest";

import { MEETING_HISTORY_QUERY_ERROR } from "./contracts";
import { createMeetingHistoryQuery } from "./query-adapter";

const CRITERIA = {
  page: 1,
  pageSize: 8,
  search: "",
  sort: "newest",
  time: "all",
} as const;

describe("meeting history query adapter", () => {
  it("projects and sorts successful rows", async () => {
    const query = createMeetingHistoryQuery(async () => ({
      count: 2,
      data: [
        {
          id: "older-id",
          starts_at: "2026-08-01T00:00:00.000Z",
          summary: null,
          title: "Older meeting",
        },
        {
          id: "newer-id",
          participant_email: "fictional.user@example.test",
          starts_at: "2026-08-02T00:00:00.000Z",
          summary: "Updated notes",
          title: "Newer meeting",
        },
      ],
      error: null,
    }));

    const result = await query(CRITERIA);

    expect(result).toEqual({
      ok: true,
      result: {
        items: [
          {
            id: "newer-id",
            startsAt: "2026-08-02T00:00:00.000Z",
            summary: "Updated notes",
            title: "Newer meeting",
          },
          {
            id: "older-id",
            startsAt: "2026-08-01T00:00:00.000Z",
            summary: null,
            title: "Older meeting",
          },
        ],
        page: 1,
        pageCount: 1,
        pageSize: 8,
        totalCount: 2,
      },
    });
    expect(JSON.stringify(result)).not.toContain("participant_email");
    expect(JSON.stringify(result)).not.toContain(
      "fictional.user@example.test",
    );
  });

  it("returns an empty success result for an empty list", async () => {
    const query = createMeetingHistoryQuery(async () => ({
      count: 0,
      data: [],
      error: null,
    }));

    await expect(query(CRITERIA)).resolves.toEqual({
      ok: true,
      result: {
        items: [],
        page: 1,
        pageCount: 1,
        pageSize: 8,
        totalCount: 0,
      },
    });
  });

  it("maps provider failures to one safe error code", async () => {
    const providerMessage = "private SQL detail for fictional.user@example.test";
    const query = createMeetingHistoryQuery(async () => ({
      count: null,
      data: null,
      error: new Error(providerMessage),
    }));

    const result = await query(CRITERIA);

    expect(result).toEqual({
      error: MEETING_HISTORY_QUERY_ERROR,
      ok: false,
    });
    expect(JSON.stringify(result)).not.toContain(providerMessage);
  });

  it("maps thrown and malformed responses to the same safe error", async () => {
    const thrownQuery = createMeetingHistoryQuery(async () => {
      throw new Error("connection detail");
    });
    const malformedQuery = createMeetingHistoryQuery(async () => ({
      count: 0,
      data: null,
      error: null,
    }));

    await expect(thrownQuery(CRITERIA)).resolves.toEqual({
      error: MEETING_HISTORY_QUERY_ERROR,
      ok: false,
    });
    await expect(malformedQuery(CRITERIA)).resolves.toEqual({
      error: MEETING_HISTORY_QUERY_ERROR,
      ok: false,
    });
  });
});
