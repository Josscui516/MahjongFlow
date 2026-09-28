import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { Database } from "@/types/database.generated";

import {
  FICTIONAL_ATTENDANCE_EVENT,
  FICTIONAL_CORRECTED_QR_ATTENDANCE,
  FICTIONAL_MANUAL_ATTENDANCE,
  FICTIONAL_QR_ATTENDANCE,
} from "./fixtures";
import {
  AttendanceAuditRepositoryError,
  createAttendanceAuditRepository,
} from "./repository";

type DbError = Readonly<{ code?: string; message: string }>;
type QueryResult<T> = Readonly<{ data: T; error: DbError | null }>;

const QR_ROW = {
  attendance_status: "confirmed",
  check_in_method: "qr",
  checked_in_at: FICTIONAL_QR_ATTENDANCE.checkedInAt,
  event_id: FICTIONAL_QR_ATTENDANCE.eventId,
  id: FICTIONAL_QR_ATTENDANCE.id,
  participant: {
    email: FICTIONAL_QR_ATTENDANCE.participantEmail,
    full_name: FICTIONAL_QR_ATTENDANCE.participantName,
  },
  participant_id: FICTIONAL_QR_ATTENDANCE.participantId,
  recorded_by: null,
  recorder: null,
  updated_at: FICTIONAL_QR_ATTENDANCE.updatedAt,
};

const MANUAL_ROW = {
  attendance_status: "voided",
  check_in_method: "manual",
  checked_in_at: FICTIONAL_MANUAL_ATTENDANCE.checkedInAt,
  event_id: FICTIONAL_MANUAL_ATTENDANCE.eventId,
  id: FICTIONAL_MANUAL_ATTENDANCE.id,
  participant: {
    email: FICTIONAL_MANUAL_ATTENDANCE.participantEmail,
    full_name: FICTIONAL_MANUAL_ATTENDANCE.participantName,
  },
  participant_id: FICTIONAL_MANUAL_ATTENDANCE.participantId,
  recorded_by: "32000000-0000-4000-8000-000000000031",
  recorder: {
    display_name: FICTIONAL_MANUAL_ATTENDANCE.recordedBy.displayName,
  },
  updated_at: FICTIONAL_MANUAL_ATTENDANCE.updatedAt,
};

const CORRECTED_QR_ROW = {
  attendance_status: "voided",
  check_in_method: "qr",
  checked_in_at: FICTIONAL_CORRECTED_QR_ATTENDANCE.checkedInAt,
  event_id: FICTIONAL_CORRECTED_QR_ATTENDANCE.eventId,
  id: FICTIONAL_CORRECTED_QR_ATTENDANCE.id,
  participant: {
    email: FICTIONAL_CORRECTED_QR_ATTENDANCE.participantEmail,
    full_name: FICTIONAL_CORRECTED_QR_ATTENDANCE.participantName,
  },
  participant_id: FICTIONAL_CORRECTED_QR_ATTENDANCE.participantId,
  recorded_by: "32000000-0000-4000-8000-000000000032",
  recorder: {
    display_name: FICTIONAL_CORRECTED_QR_ATTENDANCE.recordedBy.displayName,
  },
  updated_at: FICTIONAL_CORRECTED_QR_ATTENDANCE.updatedAt,
};

function ok<T>(data: T): QueryResult<T> {
  return { data, error: null };
}

function failed<T>(code: string, data: T): QueryResult<T> {
  return { data, error: { code, message: "database detail" } };
}

function createScriptedClient(
  eventResult: QueryResult<Readonly<{ id: string; name: string }> | null>,
  attendanceResult: QueryResult<readonly unknown[]>,
) {
  const calls: unknown[][] = [];
  const eventMaybeSingle = vi.fn(async () => eventResult);
  const eventEq = vi.fn((column: string, value: string) => {
    calls.push(["event.eq", column, value]);
    return { maybeSingle: eventMaybeSingle };
  });
  const eventSelect = vi.fn((columns: string) => {
    calls.push(["event.select", columns]);
    return { eq: eventEq };
  });

  let orderCount = 0;
  const attendanceQuery = {
    order(column: string, options?: unknown) {
      calls.push(["attendance.order", column, options]);
      orderCount += 1;
      return orderCount === 2
        ? Promise.resolve(attendanceResult)
        : attendanceQuery;
    },
  };
  const attendanceEq = vi.fn((column: string, value: string) => {
    calls.push(["attendance.eq", column, value]);
    return attendanceQuery;
  });
  const attendanceSelect = vi.fn((columns: string) => {
    calls.push(["attendance.select", columns]);
    return { eq: attendanceEq };
  });

  const from = vi.fn((table: string) => {
    calls.push(["from", table]);
    if (table === "events") return { select: eventSelect };
    if (table === "attendance_records") {
      return { select: attendanceSelect };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    calls,
    client: { from } as unknown as SupabaseClient<Database>,
  };
}

describe("createAttendanceAuditRepository", () => {
  it("returns the minimal event-scoped audit DTO for QR and manual rows", async () => {
    const scripted = createScriptedClient(
      ok(FICTIONAL_ATTENDANCE_EVENT),
      ok([QR_ROW, MANUAL_ROW, CORRECTED_QR_ROW]),
    );
    const repository = createAttendanceAuditRepository(
      async () => scripted.client,
    );

    await expect(
      repository.listForEvent(FICTIONAL_ATTENDANCE_EVENT.id),
    ).resolves.toEqual({
      event: FICTIONAL_ATTENDANCE_EVENT,
      items: [
        FICTIONAL_QR_ATTENDANCE,
        FICTIONAL_MANUAL_ATTENDANCE,
        FICTIONAL_CORRECTED_QR_ATTENDANCE,
      ],
    });

    expect(scripted.calls).toContainEqual([
      "attendance.eq",
      "event_id",
      FICTIONAL_ATTENDANCE_EVENT.id,
    ]);
    expect(scripted.calls).toContainEqual([
      "attendance.order",
      "checked_in_at",
      { ascending: false },
    ]);
    expect(scripted.calls).toContainEqual([
      "attendance.order",
      "id",
      { ascending: true },
    ]);

    const selectCall = scripted.calls.find(
      ([name]) => name === "attendance.select",
    );
    expect(selectCall?.[1]).toBe(
      "id, event_id, participant_id, attendance_status, checked_in_at, check_in_method, recorded_by, updated_at, participant:participants!attendance_records_participant_id_fkey(full_name, email), recorder:profiles!attendance_records_recorded_by_fkey(display_name)",
    );
    expect(selectCall?.[1]).not.toContain("student_id");
  });

  it("distinguishes an existing event with no attendance from an unknown event", async () => {
    const empty = createScriptedClient(
      ok(FICTIONAL_ATTENDANCE_EVENT),
      ok([]),
    );
    const missing = createScriptedClient(ok(null), ok([]));

    await expect(
      createAttendanceAuditRepository(async () => empty.client).listForEvent(
        FICTIONAL_ATTENDANCE_EVENT.id,
      ),
    ).resolves.toEqual({ event: FICTIONAL_ATTENDANCE_EVENT, items: [] });
    await expect(
      createAttendanceAuditRepository(async () => missing.client).listForEvent(
        FICTIONAL_ATTENDANCE_EVENT.id,
      ),
    ).resolves.toBeNull();
    expect(missing.calls).not.toContainEqual(["from", "attendance_records"]);
  });

  it.each([
    [{ ...QR_ROW, event_id: "32000000-0000-4000-8000-000000000099" }],
    [{ ...MANUAL_ROW, recorded_by: null, recorder: null }],
    [
      {
        ...QR_ROW,
        attendance_status: "voided",
        recorded_by: null,
        recorder: null,
      },
    ],
    [{ ...QR_ROW, check_in_method: "badge" }],
    [{ ...QR_ROW, participant: null }],
  ])("rejects malformed or out-of-scope rows", async (row) => {
    const scripted = createScriptedClient(
      ok(FICTIONAL_ATTENDANCE_EVENT),
      ok([row]),
    );
    const repository = createAttendanceAuditRepository(
      async () => scripted.client,
    );

    await expect(
      repository.listForEvent(FICTIONAL_ATTENDANCE_EVENT.id),
    ).rejects.toEqual(
      expect.objectContaining<Partial<AttendanceAuditRepositoryError>>({
        code: "INVALID_DATA",
        name: "AttendanceAuditRepositoryError",
      }),
    );
  });

  it("keeps raw database errors behind a typed repository error", async () => {
    const scripted = createScriptedClient(
      ok(FICTIONAL_ATTENDANCE_EVENT),
      failed("42501", []),
    );
    const repository = createAttendanceAuditRepository(
      async () => scripted.client,
    );

    await expect(
      repository.listForEvent(FICTIONAL_ATTENDANCE_EVENT.id),
    ).rejects.toEqual(
      expect.objectContaining<Partial<AttendanceAuditRepositoryError>>({
        code: "42501",
        message: "Attendance audit persistence failed",
      }),
    );
  });
});
