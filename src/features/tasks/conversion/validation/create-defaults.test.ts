import { describe, expect, it } from "vitest";
import { taskConversionDefaults } from "./create-defaults";
import { meetingCreateDefaults } from "@/features/meetings/editor/create-defaults";

const options = [{ id: "another-member" }, { id: "current-member" }];
describe("contextual creation defaults", () => {
  it("selects the current member and current Sydney minute for a new meeting", () => {
    expect(meetingCreateDefaults(new Date("2026-10-20T13:05:40Z"), "current-member", options)).toEqual({ attendeeIds: ["current-member"], startsAt: "2026-10-21T00:05", title: "", summary: "" });
  });
  it("uses the first two words and preserves the full agenda description", () => {
    const agenda = "  Confirm\n room booking and equipment  ";
    expect(taskConversionDefaults(agenda, new Date("2026-10-20T13:05:40Z"), "current-member", options)).toEqual({ title: "Confirm room", description: agenda, assigneeId: "current-member", dueDate: "2026-10-21", status: "not_started" });
  });
  it.each(["1", "", "确认场地", "Confirm room"])("handles short agenda text: %s", agenda => {
    expect(taskConversionDefaults(agenda, new Date("2026-06-20T14:05:00Z"), "current-member", options).title).toBe(agenda);
  });
  it("does not select someone else when the current profile is unavailable", () => {
    const now = new Date("2026-06-20T14:05:00Z");
    expect(meetingCreateDefaults(now, "missing", options).attendeeIds).toEqual([]);
    expect(taskConversionDefaults("Confirm room", now, "missing", options)).toMatchObject({ assigneeId: "", dueDate: "2026-06-21" });
  });
});
