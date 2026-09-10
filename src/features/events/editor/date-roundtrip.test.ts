import { describe, expect, it } from "vitest";
import { localDateTime } from "./EventEditor";
import { validateEventInput } from "../core/validation";

describe("persisted event time round trip", () => {
  it.each(["2026-09-12T08:00:00+00:00", "2026-12-12T08:00:00+00:00", "2026-09-12T18:00:00+10:00"])("preserves %s when editing other fields", (startsAt) => {
    const result = validateEventInput({ name: "Fictional event", location: "Room", description: "", eventType: "weekly_session", status: "scheduled", requiresStudentId: false, startsAt: localDateTime(startsAt) });
    expect(result.ok && result.value.startsAt).toBe(new Date(startsAt).toISOString());
  });
});
