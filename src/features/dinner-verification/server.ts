import "server-only";
import { attendanceAuditService } from "@/features/attendance/records/server";

import { type DinnerRosterResult, type DinnerRosterReadPort } from "./roster";
import { matchedDinnerAttendance } from "./matched-attendance";

import { calculateDinnerEligibility, type DinnerEligibility } from "./index";
import type { DinnerVerificationResult } from "./contracts";

export type DinnerEligibilityResult =
  | Extract<DinnerRosterResult, { ok: false }>
  | Readonly<{
      ok: true;
      eventId: string;
      participantId: string;
      eligibility: DinnerEligibility;
    }>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createDinnerEligibilityReader(roster: DinnerRosterReadPort) {
  return async function readDinnerEligibility(
    eventId: string,
    participantId: string,
  ): Promise<DinnerEligibilityResult> {
    try {
      // The public provider authorises before validating or querying the event.
      // Never turn a failed/denied read into a successful "not eligible" result.
      const result = await roster.listForEvent(eventId);
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
            rosterStatus: current.status,
          } : null,
        ),
      };
    } catch {
      return { ok: false, code: "SYSTEM_ERROR" };
    }
  };
}

export const readDinnerEligibility = createDinnerEligibilityReader(matchedDinnerAttendance);

export function createDinnerVerificationReader(
  roster: DinnerRosterReadPort,
  now: () => Date = () => new Date(),
) {
  return async function readDinnerVerification(eventId: string): Promise<DinnerVerificationResult> {
    try {
      const result = await roster.listForEvent(eventId);
      if (!result.ok) return { ok: false, code: result.code };
      if (typeof eventId !== "string" || !UUID.test(eventId)) return { ok: false, code: "VALIDATION" };
      const currentEventId = eventId.toLowerCase();
      const seen = new Set<string>();
      if (result.event.id.toLowerCase() !== currentEventId) return { ok: false, code: "SYSTEM_ERROR" };
      for (const item of result.items) {
        const id = item.participantId.toLowerCase();
        if (item.eventId.toLowerCase() !== currentEventId || seen.has(id) || !UUID.test(id)) {
          return { ok: false, code: "SYSTEM_ERROR" };
        }
        seen.add(id);
      }
      const items = result.items.filter((item) => item.status === "listed" || item.issuedAt).map((item) => ({
        participantId: item.participantId.toLowerCase(),
        participantName: item.participantName,
        participantEmail: item.participantEmail,
        ...(item.issuedAt !== undefined ? { issuedAt: item.issuedAt } : {}),
        eligibility: calculateDinnerEligibility(currentEventId, item.participantId.toLowerCase(), {
          eventId: currentEventId,
          participantId: item.participantId.toLowerCase(),
          rosterStatus: item.status,
        }),
      }));
      return {
        ok: true,
        event: { id: currentEventId, name: result.event.name },
        items,
        eligibleCount: items.filter((item) => item.eligibility === "Eligible").length,
        readAt: now().toISOString(),
      };
    } catch { return { ok: false, code: "SYSTEM_ERROR" }; }
  };
}

export function createConfirmedDinnerReader(
  readDinner: (eventId: string) => Promise<DinnerVerificationResult>,
  attendance: import("@/features/attendance/records/server").AttendanceReadPort,
) {
  return async (eventId: string): Promise<DinnerVerificationResult> => {
    try {
      const dinner = await readDinner(eventId);
      if (!dinner.ok) return dinner;
      const audit = await attendance.listForEvent(eventId);
      if (!audit.ok) return audit;
      if (audit.event.id.toLowerCase() !== dinner.event.id) return { ok: false, code: "SYSTEM_ERROR" };
      const confirmed = audit.items.filter(row => row.status === "confirmed");
      const ids = new Set(confirmed.map(row => row.participantId.toLowerCase()));
      const matches = new Map(dinner.items.map(row => [row.participantId, row]));
      const items = confirmed.map(row => ({
        participantId: row.participantId.toLowerCase(),
        participantName: row.participantName,
        participantEmail: row.participantEmail,
        eligibility: matches.get(row.participantId.toLowerCase())?.eligibility ?? "Not Eligible Yet" as const,
        issuedAt: matches.get(row.participantId.toLowerCase())?.issuedAt,
      }));
      return { ...dinner, items, eligibleCount: items.filter(row => row.eligibility === "Eligible").length,
        previousIssuedItems: dinner.items.filter(row => row.issuedAt && !ids.has(row.participantId)),
      };
    } catch { return { ok: false, code: "SYSTEM_ERROR" }; }
  };
}

export const readDinnerVerification = createConfirmedDinnerReader(
  createDinnerVerificationReader(matchedDinnerAttendance), attendanceAuditService,
);

export { readDinnerEligibilityCount } from "./safe-count";
