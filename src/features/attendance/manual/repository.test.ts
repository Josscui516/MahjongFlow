import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { Database } from "@/types/database.generated";
import type { ManualAttendanceCommand } from "./contracts";
import { createManualAttendanceRepository, ManualAttendanceRepositoryError } from "./repository";

const EVENT_ID = "33000000-0000-4000-8000-000000000001";
const PARTICIPANT_ID = "33000000-0000-4000-8000-000000000002";
const RECORD_ID = "33000000-0000-4000-8000-000000000003";
const VERSION = "2026-09-28T04:12:34.123456+00:00";
const UPDATED_VERSION = "2026-09-28T04:12:35.987654+00:00";
const CREATE: ManualAttendanceCommand = { operation: "create", eventId: EVENT_ID, email: "fictional.participant@example.test" };
const CORRECT: ManualAttendanceCommand = { operation: "correct", eventId: EVENT_ID, recordId: RECORD_ID, expectedUpdatedAt: VERSION, targetStatus: "voided" };

type QueryResult = Readonly<{ data: unknown; error: { code: string; message: string } | null }>;
const ok = (data: unknown): QueryResult => ({ data, error: null });
const failed = (code: string): QueryResult => ({ data: null, error: { code, message: "private database detail" } });

function setup(overrides: Partial<Record<"events" | "participants" | "attendance_records", QueryResult>> = {}) {
  const results = {
    events: ok({ id: EVENT_ID }),
    participants: ok({ id: PARTICIPANT_ID }),
    attendance_records: ok({ event_id: EVENT_ID, updated_at: UPDATED_VERSION }),
    ...overrides,
  };
  const calls: unknown[][] = [];
  const from = vi.fn((table: keyof typeof results) => {
    calls.push(["from", table]);
    if (!(table in results)) throw new Error("Unexpected table");
    const query = {
      select(columns: string) { calls.push([table, "select", columns]); return query; },
      eq(column: string, value: string) { calls.push([table, "eq", column, value]); return query; },
      insert(payload: unknown) { calls.push([table, "insert", payload]); return query; },
      update(payload: unknown) { calls.push([table, "update", payload]); return query; },
      async single() { calls.push([table, "single"]); return results[table]; },
      async maybeSingle() { calls.push([table, "maybeSingle"]); return results[table]; },
    };
    return query;
  });
  const getClient = vi.fn(async () => ({ from }) as unknown as SupabaseClient<Database>);
  return { calls, getClient, repository: createManualAttendanceRepository(getClient) };
}

describe("manual attendance persistence boundary", () => {
  it("looks up an existing participant and inserts only columns granted to authenticated users", async () => {
    const context = setup();
    await expect(context.repository.execute(CREATE)).resolves.toEqual({ outcome: "updated", eventId: EVENT_ID, updatedAt: UPDATED_VERSION });
    expect(context.getClient).toHaveBeenCalledOnce();
    expect(context.calls).toEqual([
      ["from", "events"], ["events", "select", "id"], ["events", "eq", "id", EVENT_ID], ["events", "maybeSingle"],
      ["from", "participants"], ["participants", "select", "id"], ["participants", "eq", "email", CREATE.email], ["participants", "maybeSingle"],
      ["from", "attendance_records"], ["attendance_records", "insert", { event_id: EVENT_ID, participant_id: PARTICIPANT_ID }],
      ["attendance_records", "select", "event_id, updated_at"], ["attendance_records", "single"],
    ]);
  });

  it.each(["confirmed", "voided"] as const)("atomically corrects to %s using exact event, row, version and prior status predicates", async (targetStatus) => {
    const context = setup();
    await expect(context.repository.execute({ ...CORRECT, targetStatus })).resolves.toEqual({ outcome: "updated", eventId: EVENT_ID, updatedAt: UPDATED_VERSION });
    expect(context.calls).toEqual([
      ["from", "events"], ["events", "select", "id"], ["events", "eq", "id", EVENT_ID], ["events", "maybeSingle"],
      ["from", "attendance_records"], ["attendance_records", "update", { attendance_status: targetStatus }],
      ["attendance_records", "eq", "event_id", EVENT_ID], ["attendance_records", "eq", "id", RECORD_ID],
      ["attendance_records", "eq", "updated_at", VERSION],
      ["attendance_records", "eq", "attendance_status", targetStatus === "confirmed" ? "voided" : "confirmed"],
      ["attendance_records", "select", "event_id, updated_at"], ["attendance_records", "maybeSingle"],
    ]);
  });

  it("does not write or search participant facts if the event is unavailable", async () => {
    const context = setup({ events: ok(null) });
    await expect(context.repository.execute(CREATE)).resolves.toEqual({ outcome: "unavailable" });
    expect(context.calls.filter(([operation]) => operation === "from")).toEqual([["from", "events"]]);
  });

  it("returns missing participant without creating participant, registration or attendance", async () => {
    const context = setup({ participants: ok(null) });
    await expect(context.repository.execute(CREATE)).resolves.toEqual({ outcome: "participant-missing" });
    expect(context.calls.filter(([operation]) => operation === "from")).toEqual([["from", "events"], ["from", "participants"]]);
  });

  it("reports a stale or already-changed correction as conflict without a second update", async () => {
    const context = setup({ attendance_records: ok(null) });
    await expect(context.repository.execute(CORRECT)).resolves.toEqual({ outcome: "conflict" });
    expect(context.calls.filter(([, operation]) => operation === "update")).toHaveLength(1);
  });

  it("does not report success when an insert has no returned row", async () => {
    const context = setup({ attendance_records: ok(null) });
    await expect(context.repository.execute(CREATE)).rejects.toBeInstanceOf(ManualAttendanceRepositoryError);
  });

  it.each(["events", "participants", "attendance_records"] as const)("sanitises failures from %s without subsequent queries", async (table) => {
    const context = setup({ [table]: failed("42501") });
    await expect(context.repository.execute(CREATE)).rejects.toMatchObject({ code: "42501", message: "Manual attendance persistence failed" });
    const tables = context.calls.filter(([operation]) => operation === "from").map(([, name]) => name);
    expect(tables.at(-1)).toBe(table);
    if (table !== "attendance_records") expect(context.calls.some(([, operation]) => operation === "insert")).toBe(false);
  });

  it("propagates a uniqueness race without an upsert or retry", async () => {
    const context = setup({ attendance_records: failed("23505") });
    await expect(context.repository.execute(CREATE)).rejects.toMatchObject({ code: "23505" });
    expect(context.calls.filter(([, operation]) => operation === "insert")).toHaveLength(1);
    expect(context.calls.some(([, operation]) => operation === "update")).toBe(false);
  });

  it.each([
    { event_id: "33000000-0000-4000-8000-000000000099", updated_at: UPDATED_VERSION },
    { event_id: EVENT_ID, updated_at: null },
    { event_id: EVENT_ID, updated_at: "not-a-date" },
  ])("rejects malformed or out-of-scope persisted metadata", async (row) => {
    const context = setup({ attendance_records: ok(row) });
    await expect(context.repository.execute(CORRECT)).rejects.toMatchObject({ code: "INVALID_DATA" });
  });
});
