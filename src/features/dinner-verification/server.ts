import "server-only";

import {
  attendanceAuditService,
  type AttendanceAuditResult,
  type AttendanceReadPort,
} from "@/features/attendance/records/server";

import { calculateDinnerEligibility, type DinnerEligibility } from "./index";

export type DinnerEligibilityResult =
  | Extract<AttendanceAuditResult, { ok: false }>
  | Readonly<{
      ok: true;
      eventId: string;
      participantId: string;
      eligibility: DinnerEligibility;
    }>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createDinnerEligibilityReader(attendance: AttendanceReadPort) {
  return async function readDinnerEligibility(
    eventId: string,
    participantId: string,
  ): Promise<DinnerEligibilityResult> {
    try {
      // The public provider authorises before validating or querying the event.
      // Never turn a failed/denied read into a successful "not eligible" result.
      const result = await attendance.listForEvent(eventId);
      if (!result.ok) return { ok: false, code: result.code };
      if (typeof participantId !== "string" || !UUID.test(participantId)) {
        return { ok: false, code: "VALIDATION" };
      }

      const currentEventId = eventId.toLowerCase();
      const currentParticipantId = participantId.toLowerCase();
      if (
        result.event.id.toLowerCase() !== currentEventId ||
        result.items.some((item) => item.eventId.toLowerCase() !== currentEventId)
      ) return { ok: false, code: "SYSTEM_ERROR" };

      const matches = result.items.filter(
        (item) => item.participantId.toLowerCase() === currentParticipantId,
      );
      if (matches.length > 1) return { ok: false, code: "SYSTEM_ERROR" };
      const current = matches[0];

      return {
        ok: true,
        eventId: currentEventId,
        participantId: currentParticipantId,
        eligibility: calculateDinnerEligibility(
          currentEventId,
          currentParticipantId,
          current ? {
            eventId: current.eventId.toLowerCase(),
            participantId: current.participantId.toLowerCase(),
            attendanceStatus: current.status,
          } : null,
        ),
      };
    } catch {
      return { ok: false, code: "SYSTEM_ERROR" };
    }
  };
}

export const readDinnerEligibility = createDinnerEligibilityReader(attendanceAuditService);
