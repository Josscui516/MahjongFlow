import { describe, expect, it } from "vitest";

import { validateCheckInWindow } from "./validation";

describe("check-in window validation", () => {
  it.each([null, undefined, true, [], {}, { opensAt: 42 }, { opensAt: {}, closesAt: [] }])(
    "returns safe validation errors for malformed runtime input %j", (input) => {
      expect(validateCheckInWindow(input)).toEqual({
        ok: false,
        errors: [
          { field: "opensAt", message: "Choose a valid Sydney opening date and time." },
          { field: "closesAt", message: "Choose a valid Sydney closing date and time." },
        ],
      });
    },
  );

  it("normalises Sydney winter and summer wall-clock values", () => {
    expect(validateCheckInWindow({ opensAt: "2026-07-10T18:00", closesAt: "2026-07-10T22:00" })).toEqual({
      ok: true,
      value: { opensAt: "2026-07-10T08:00:00.000Z", closesAt: "2026-07-10T12:00:00.000Z" },
    });
    expect(validateCheckInWindow({ opensAt: "2026-12-10T18:00", closesAt: "2026-12-10T22:00" })).toEqual({
      ok: true,
      value: { opensAt: "2026-12-10T07:00:00.000Z", closesAt: "2026-12-10T11:00:00.000Z" },
    });
  });

  it("rejects missing, reversed, and nonexistent daylight-saving values", () => {
    expect(validateCheckInWindow({ opensAt: "", closesAt: "" })).toMatchObject({ ok: false });
    expect(validateCheckInWindow({ opensAt: "2026-09-10T20:00", closesAt: "2026-09-10T19:00" })).toMatchObject({ ok: false });
    expect(validateCheckInWindow({ opensAt: "2026-10-04T02:30", closesAt: "2026-10-04T04:00" })).toMatchObject({ ok: false });
  });
});
