import { expect, it } from "vitest";
import { initialWindowInput } from "./window-defaults";
const empty = { active: false, opensAt: null, closesAt: null, createdAt: null, revokedAt: null };
it("defaults to event start and two hours later in Sydney time", () => {
  expect(initialWindowInput(empty, "2026-10-21T08:00:00Z")).toEqual({ opensAt: "2026-10-21T19:00", closesAt: "2026-10-21T21:00" });
});
it("rolls the closing date forward across Sydney midnight", () => {
  expect(initialWindowInput(empty, "2026-10-21T12:30:00Z")).toEqual({ opensAt: "2026-10-21T23:30", closesAt: "2026-10-22T01:30" });
});
it("adds two elapsed hours across the daylight-saving change", () => {
  expect(initialWindowInput(empty, "2026-10-03T15:30:00Z")).toEqual({ opensAt: "2026-10-04T01:30", closesAt: "2026-10-04T04:30" });
});
it("preserves manually saved settings even when the event start differs", () => {
  expect(initialWindowInput({ ...empty, opensAt: "2026-10-21T07:30:00Z", closesAt: "2026-10-21T13:00:00Z" }, "2026-10-21T08:00:00Z")).toEqual({ opensAt: "2026-10-21T18:30", closesAt: "2026-10-22T00:00" });
});
