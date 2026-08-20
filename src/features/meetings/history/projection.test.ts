import { describe, expect, it } from "vitest";

import type { MeetingHistoryItem } from "./contracts";
import {
  projectMeetingHistoryRows,
  sortMeetingHistoryItems,
} from "./projection";

describe("meeting history projection", () => {
  it("orders timestamps descending and equal timestamps by code-point ID", () => {
    const rows = [
      {
        id: "b-id",
        starts_at: "2026-08-12T20:00:00+10:00",
        summary: null,
        title: "Same instant B",
      },
      {
        id: "z-id",
        starts_at: "2026-08-01T10:00:00.000Z",
        summary: "Older summary",
        title: "Older meeting",
      },
      {
        id: "a-id",
        starts_at: "2026-08-12T10:00:00.000Z",
        summary: "Updated summary",
        title: "Same instant A",
      },
    ];

    const items = projectMeetingHistoryRows(rows);

    expect(items.map(({ id }) => id)).toEqual(["a-id", "b-id", "z-id"]);
    expect(items[0]).toEqual({
      id: "a-id",
      startsAt: "2026-08-12T10:00:00.000Z",
      summary: "Updated summary",
      title: "Same instant A",
    });
  });

  it("does not mutate the caller's item order", () => {
    const items: readonly MeetingHistoryItem[] = [
      {
        id: "later-id",
        startsAt: "2026-08-01T00:00:00.000Z",
        summary: null,
        title: "Earlier meeting",
      },
      {
        id: "newer-id",
        startsAt: "2026-08-02T00:00:00.000Z",
        summary: null,
        title: "Newer meeting",
      },
    ];

    const sorted = sortMeetingHistoryItems(items);

    expect(sorted.map(({ id }) => id)).toEqual(["newer-id", "later-id"]);
    expect(items.map(({ id }) => id)).toEqual(["later-id", "newer-id"]);
  });

  it.each([
    null,
    {},
    [{ id: "meeting-id", starts_at: "not-a-date", summary: null, title: "Title" }],
    [{ id: "meeting-id", starts_at: "2026-08-01T00:00:00.000Z", summary: 12, title: "Title" }],
  ])("rejects an invalid provider projection", (value) => {
    expect(() => projectMeetingHistoryRows(value)).toThrow(
      /Invalid meeting history/,
    );
  });
});
