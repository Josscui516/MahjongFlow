import { expect, it } from "vitest";
import { validateEventInput } from "./validation";
import type { EventInput } from "./contracts";
const input: EventInput = { name: "Fictional", location: "Room", description: "", startsAt: "2026-09-12T08:00:00Z", eventType: "weekly_session", status: "scheduled", requiresStudentId: false };
it.each([null, {}, { ...input, requiresStudentId: "false" }, { ...input, startsAt: "2026-02-30T08:00:00Z" }, { ...input, startsAt: "2026-09-12" }])("rejects malformed runtime inputs", (value) => { expect(validateEventInput(value as EventInput).ok).toBe(false); });
