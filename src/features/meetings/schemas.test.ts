import { describe, expect, test } from "vitest";
import { validateMeetingInput } from "./schemas";

const attendeeId = "11111111-1111-4111-8111-111111111111";

describe("meeting input validation", () => {
  test("normalises complete M-01 input using Australia/Sydney time", () => {
    expect(validateMeetingInput({
      attendeeIds: [attendeeId],
      startsAt: "2026-08-20T18:30",
      summary: "  Fictional planning summary.  ",
      title: "  Weekly planning meeting  ",
    })).toEqual({
      ok: true,
      value: {
        attendeeIds: [attendeeId],
        startsAt: "2026-08-20T08:30:00.000Z",
        summary: "Fictional planning summary.",
        title: "Weekly planning meeting",
      },
    });
  });

  test("rejects every missing M-02 field", () => {
    const result = validateMeetingInput({ attendeeIds: [], startsAt: "", summary: "", title: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map(({ field }) => field).sort()).toEqual(["attendeeIds", "startsAt", "summary", "title"]);
  });

  test("rejects duplicate attendees and a nonexistent Sydney DST time", () => {
    const result = validateMeetingInput({
      attendeeIds: [attendeeId, attendeeId],
      startsAt: "2026-10-04T02:30",
      summary: "Fictional summary.",
      title: "Fictional meeting",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map(({ field }) => field).sort()).toEqual(["attendeeIds", "startsAt"]);
  });

  test("normalises Sydney midnight and chooses the first repeated DST instant", () => {
    const midnight = validateMeetingInput({
      attendeeIds: [attendeeId],
      startsAt: "2026-08-20T00:00",
      summary: "Fictional summary.",
      title: "Fictional meeting",
    });
    const repeatedHour = validateMeetingInput({
      attendeeIds: [attendeeId],
      startsAt: "2026-04-05T02:30",
      summary: "Fictional summary.",
      title: "Fictional meeting",
    });

    expect(midnight).toMatchObject({ ok: true, value: { startsAt: "2026-08-19T14:00:00.000Z" } });
    expect(repeatedHour).toMatchObject({ ok: true, value: { startsAt: "2026-04-04T15:30:00.000Z" } });
  });

  test("validates explicit offsets without accepting normalised calendar dates", () => {
    const explicitOffset = validateMeetingInput({
      attendeeIds: [attendeeId],
      startsAt: "2026-08-20T18:30:15.250+10:00",
      summary: "Fictional summary.",
      title: "Fictional meeting",
    });
    const impossibleDate = validateMeetingInput({
      attendeeIds: [attendeeId],
      startsAt: "2026-02-30T10:00:00Z",
      summary: "Fictional summary.",
      title: "Fictional meeting",
    });

    expect(explicitOffset).toMatchObject({ ok: true, value: { startsAt: "2026-08-20T08:30:15.250Z" } });
    expect(impossibleDate).toMatchObject({ ok: false, errors: [{ field: "startsAt" }] });
  });

  test("preserves fractional seconds for a Sydney local time", () => {
    const result = validateMeetingInput({
      attendeeIds: [attendeeId],
      startsAt: "2026-08-20T18:30:15.250",
      summary: "Fictional summary.",
      title: "Fictional meeting",
    });

    expect(result).toMatchObject({ ok: true, value: { startsAt: "2026-08-20T08:30:15.250Z" } });
  });
});
