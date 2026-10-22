import { expect, it } from "vitest";
import { readEventForm } from "./form-input";
import { validateEventInput } from "../core/validation";

it("validates the native date and ignores the retired student ID checkbox", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: "Fictional event", description: "Fixture", location: "Room", eventType: "tournament", status: "scheduled", startsAt: "2026-10-15T18:30", requiresStudentId: "on" })) form.set(key, value);
  const result = validateEventInput(readEventForm(form));
  expect(result).toMatchObject({ ok: true, value: { startsAt: "2026-10-15T07:30:00.000Z", requiresStudentId: false } });
  form.delete("requiresStudentId");
  expect(readEventForm(form).requiresStudentId).toBe(false);
  form.set("startsAt", "");
  expect(validateEventInput(readEventForm(form)).ok).toBe(false);
});
