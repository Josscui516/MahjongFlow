import { describe, expect, it } from "vitest";

import {
  calendarDateAt,
  parseIsoCalendarDate,
  SYDNEY_TIME_ZONE,
} from "@/lib/dates";

import {
  FIXED_SYDNEY_TODAY,
  fixedSydneyNow,
} from "./fixed-sydney-clock.fixture";

describe("ISO calendar dates", () => {
  it.each([
    "2024-02-29",
    "2026-01-01",
    "2026-01-31",
    "2026-12-31",
    "2027-01-01",
  ])("accepts the real calendar date %s", (isoDate) => {
    expect(parseIsoCalendarDate(isoDate)).toMatchObject({
      ok: true,
      value: { isoDate },
    });
  });

  it.each([
    "",
    "2026-2-01",
    "2026-02-29",
    "2026-02-30",
    "2026-04-31",
    "2026-13-01",
    "0000-01-01",
    "not-a-date",
  ])("rejects the malformed or impossible date %s", (isoDate) => {
    expect(parseIsoCalendarDate(isoDate)).toEqual({
      ok: false,
      reason: "INVALID_DATE",
      value: "invalid",
    });
  });
});

describe("zoned calendar dates", () => {
  it("derives the fixed Sydney date without reading the global clock", () => {
    expect(calendarDateAt(fixedSydneyNow(), SYDNEY_TIME_ZONE)).toMatchObject({
      ok: true,
      value: { isoDate: FIXED_SYDNEY_TODAY },
    });
  });

  it.each([
    ["2026-08-31T13:59:59.999Z", "2026-08-31"],
    ["2026-08-31T14:00:00.000Z", "2026-09-01"],
    ["2026-12-31T12:59:59.999Z", "2026-12-31"],
    ["2026-12-31T13:00:00.000Z", "2027-01-01"],
  ])("maps %s to Sydney calendar date %s", (instant, expectedDate) => {
    expect(calendarDateAt(new Date(instant), SYDNEY_TIME_ZONE)).toMatchObject({
      ok: true,
      value: { isoDate: expectedDate },
    });
  });

  it.each([
    ["2026-10-03T15:59:59.999Z", "2026-10-04"],
    ["2026-10-03T16:00:00.000Z", "2026-10-04"],
    ["2026-04-04T15:59:59.999Z", "2026-04-05"],
    ["2026-04-04T16:00:00.000Z", "2026-04-05"],
  ])("keeps the Sydney date stable through a DST transition at %s", (instant, expectedDate) => {
    expect(calendarDateAt(new Date(instant), SYDNEY_TIME_ZONE)).toMatchObject({
      ok: true,
      value: { isoDate: expectedDate },
    });
  });

  it("returns explicit failures for an invalid instant and unknown zone", () => {
    expect(calendarDateAt(new Date(Number.NaN), SYDNEY_TIME_ZONE)).toEqual({
      ok: false,
      reason: "INVALID_INSTANT",
      value: "invalid",
    });
    expect(calendarDateAt(null as unknown as Date, SYDNEY_TIME_ZONE)).toEqual({
      ok: false,
      reason: "INVALID_INSTANT",
      value: "invalid",
    });
    expect(calendarDateAt(fixedSydneyNow(), "Mars/Olympus_Mons")).toEqual({
      ok: false,
      reason: "UNSUPPORTED_TIME_ZONE",
      value: "invalid",
    });
    expect(calendarDateAt(fixedSydneyNow(), undefined as unknown as string)).toEqual({
      ok: false,
      reason: "UNSUPPORTED_TIME_ZONE",
      value: "invalid",
    });
  });
});
