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
});
