import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
import { eventCreateDefaults, localDateTime } from "./create-defaults";
import { EventEditor } from "./EventEditor";
import { validateEventInput } from "../core/validation";

it.each([
  ["2026-10-20T13:00:59Z", "2026-10-21T00:00"],
  ["2026-07-01T00:23:45Z", "2026-07-01T10:23"],
  ["2026-10-03T15:59:00Z", "2026-10-04T01:59"],
  ["2026-10-03T16:00:00Z", "2026-10-04T03:00"],
])("uses the Sydney minute for %s", (instant, expected) => {
  expect(eventCreateDefaults(new Date(instant))).toMatchObject({ startsAt: expected, eventType: "weekly_session", status: "scheduled", requiresStudentId: false });
});

it("renders fresh create defaults and preserves an existing event's time, type and status", () => {
  const actions = { createEventAction: vi.fn(), updateEventAction: vi.fn() };
  const created = renderToStaticMarkup(<EventEditor {...actions} createInstant="2026-10-21T07:00:00Z" />);
  expect(created).toContain('value="2026-10-21T18:00"');
  expect(created).toContain('<option value="weekly_session" selected="">');
  expect(created).toContain('<option value="scheduled" selected="">');
  expect(created).not.toContain('name="requiresStudentId"');
  const record = { ...eventCreateDefaults(new Date("2026-07-01T00:23:00Z")), startsAt: "2026-07-01T00:23:00Z", eventType: "tournament" as const, status: "cancelled" as const, requiresStudentId: true, id: "fictional", createdBy: "fictional", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
  const edited = renderToStaticMarkup(<EventEditor {...actions} initialRecord={record} createInstant="2026-10-21T07:00:00Z" />);
  expect(edited).toContain(`value="${localDateTime(record.startsAt)}"`);
  expect(edited).toContain('<option value="tournament" selected="">');
  expect(edited).toContain('<option value="cancelled" selected="">');
  expect(edited).not.toContain('name="requiresStudentId"');
});

it("ignores a forged retired requirement before event persistence", () => {
  const result = validateEventInput({ ...eventCreateDefaults(new Date("2026-10-21T07:00:00Z")), name: "Fictional session", description: "Fictional activities", location: "Fictional room", requiresStudentId: true });
  expect(result).toMatchObject({ ok: true, value: { requiresStudentId: false } });
});
