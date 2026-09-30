import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";

import type {
  AttendanceAuditEvent,
  AttendanceAuditRecord,
  AttendanceMethod,
  AttendanceStatus,
} from "./contracts";

const ATTENDANCE_SELECT =
  "id, event_id, participant_id, attendance_status, checked_in_at, check_in_method, recorded_by, updated_at, participant:participants!attendance_records_participant_id_fkey(full_name, email), recorder:profiles!attendance_records_recorded_by_fkey(display_name)";

type AttendanceQueryRow = Readonly<{
  attendance_status: unknown;
  check_in_method: unknown;
  checked_in_at: unknown;
  event_id: unknown;
  id: unknown;
  participant: unknown;
  participant_id: unknown;
  recorded_by: unknown;
  recorder: unknown;
  updated_at: unknown;
}>;

type AttendanceAuditSnapshot = Readonly<{
  event: AttendanceAuditEvent;
  items: readonly AttendanceAuditRecord[];
}>;

export type AttendanceAuditRepository = Readonly<{
  listForEvent: (eventId: string) => Promise<AttendanceAuditSnapshot | null>;
}>;

export class AttendanceAuditRepositoryError extends Error {
  constructor(readonly code?: string) {
    super("Attendance audit persistence failed");
    this.name = "AttendanceAuditRepositoryError";
  }
}

function fail(error?: Readonly<{ code?: string }>): never {
  throw new AttendanceAuditRepositoryError(error?.code);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isMethod(value: unknown): value is AttendanceMethod {
  return value === "manual" || value === "qr";
}

function isStatus(value: unknown): value is AttendanceStatus {
  return value === "confirmed" || value === "voided";
}

function requiredText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function mapAttendanceRow(
  rawRow: unknown,
  expectedEventId: string,
): AttendanceAuditRecord {
  if (!isRecord(rawRow)) fail({ code: "INVALID_DATA" });

  const row = rawRow as AttendanceQueryRow;
  if (
    !requiredText(row.id) ||
    !requiredText(row.event_id) ||
    row.event_id.toLowerCase() !== expectedEventId.toLowerCase() ||
    !requiredText(row.participant_id) ||
    !requiredText(row.checked_in_at) ||
    !requiredText(row.updated_at) ||
    !isMethod(row.check_in_method) ||
    !isStatus(row.attendance_status) ||
    !isRecord(row.participant) ||
    !requiredText(row.participant.full_name) ||
    !requiredText(row.participant.email)
  ) {
    fail({ code: "INVALID_DATA" });
  }

  let recordedBy: Readonly<{ displayName: string }> | null = null;
  if (row.recorded_by !== null) {
    if (
      !requiredText(row.recorded_by) ||
      !isRecord(row.recorder) ||
      !requiredText(row.recorder.display_name)
    ) {
      fail({ code: "INVALID_DATA" });
    }
    recordedBy = { displayName: row.recorder.display_name };
  } else if (row.recorder !== null) {
    fail({ code: "INVALID_DATA" });
  }

  if (
    (row.check_in_method === "manual" ||
      row.attendance_status === "voided") &&
    !recordedBy
  ) {
    fail({ code: "INVALID_DATA" });
  }

  const base = {
    checkedInAt: row.checked_in_at,
    eventId: row.event_id,
    id: row.id,
    participantEmail: row.participant.email,
    participantId: row.participant_id,
    participantName: row.participant.full_name,
    updatedAt: row.updated_at,
  };

  if (!recordedBy) {
    return {
      ...base,
      method: "qr",
      recordedBy: null,
      status: "confirmed",
    };
  }

  return {
    ...base,
    method: row.check_in_method,
    recordedBy,
    status: row.attendance_status,
  };
}

export function createAttendanceAuditRepository(
  getClient: () => Promise<SupabaseClient<Database>> =
    createServerSupabaseClient,
): AttendanceAuditRepository {
  return {
    async listForEvent(eventId) {
      const client = await getClient();
      const eventResult = await client
        .from("events")
        .select("id, name")
        .eq("id", eventId)
        .maybeSingle();

      if (eventResult.error) fail(eventResult.error);
      if (!eventResult.data) return null;
      if (
        !requiredText(eventResult.data.id) ||
        eventResult.data.id.toLowerCase() !== eventId.toLowerCase() ||
        !requiredText(eventResult.data.name)
      ) {
        fail({ code: "INVALID_DATA" });
      }

      const attendanceResult = await client
        .from("attendance_records")
        .select(ATTENDANCE_SELECT, { count: "exact" })
        .eq("event_id", eventId)
        .order("checked_in_at", { ascending: false })
        .order("id", { ascending: true });

      if (attendanceResult.error) fail(attendanceResult.error);
      // PostgREST may cap the response. Consumers must never interpret an
      // omitted attendee as absent or present a partial list as a full count.
      if (
        attendanceResult.count === null ||
        attendanceResult.count !== (attendanceResult.data ?? []).length
      ) {
        fail({ code: "INCOMPLETE_DATA" });
      }

      return {
        event: {
          id: eventResult.data.id,
          name: eventResult.data.name,
        },
        items: (attendanceResult.data ?? []).map((row) =>
          mapAttendanceRow(row, eventId),
        ),
      };
    },
  };
}
