import { describe, expect, it } from "vitest";
import { validateEventInput } from "./validation";
const valid = { description: "Fictional club event.", eventType: "weekly_session" as const, location: "Fictional Campus Room", name: "Fictional weekly session", requiresStudentId: false, startsAt: "2026-09-12T08:00", status: "scheduled" as const };
describe("event validation", () => {
  it("rejects blank descriptions before the database non-empty constraint", () => {
    expect(validateEventInput({ ...valid, description: "  " })).toMatchObject({ ok: false, errors: [{ field: "description" }] });
  });
  it.each(["weekly_session", "tournament"] as const)("accepts %s and normalises the Sydney instant", (eventType) => { const result = validateEventInput({ ...valid, eventType }); expect(result.ok).toBe(true); if (result.ok) expect(result.value.startsAt).toBe("2026-09-11T22:00:00.000Z"); });
  it("rejects missing fields and unknown enum values", () => { const result = validateEventInput({ ...valid, eventType: "other" as never, location: " ", name: "", startsAt: "invalid", status: "draft" as never }); expect(result.ok).toBe(false); if (!result.ok) expect(result.errors.map((item) => item.field)).toEqual(expect.arrayContaining(["name", "location", "eventType", "status", "startsAt"])); });
});
