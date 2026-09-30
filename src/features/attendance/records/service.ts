import "server-only";

import {
  AuthorizationError,
  requireAuthorised,
  type AccessContext,
} from "@/lib/auth/authorization";

import type {
  AttendanceAuditResult,
  AttendanceReadPort,
} from "./contracts";
import {
  AttendanceAuditRepositoryError,
  createAttendanceAuditRepository,
  type AttendanceAuditRepository,
} from "./repository";

type AuthorisedContext = AccessContext & Readonly<{ role: "authorised" }>;

export type AttendanceAuditDependencies = Readonly<{
  authorise: () => Promise<AuthorisedContext>;
  repository: AttendanceAuditRepository;
}>;

function isEventId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function failure(error: unknown): AttendanceAuditResult {
  if (error instanceof AuthorizationError) {
    return {
      code:
        error.code === "UNAUTHENTICATED"
          ? "UNAUTHENTICATED"
          : "PERMISSION_DENIED",
      ok: false,
    };
  }

  if (error instanceof AttendanceAuditRepositoryError) {
    if (["42501", "PGRST301"].includes(error.code ?? "")) {
      return { code: "PERMISSION_DENIED", ok: false };
    }
    if (error.code === "22P02") {
      return { code: "VALIDATION", ok: false };
    }
  }

  return { code: "SYSTEM_ERROR", ok: false };
}

export function createAttendanceAuditService(
  dependencies: AttendanceAuditDependencies,
): AttendanceReadPort {
  return {
    async listForEvent(eventId) {
      try {
        // Authorise before validating identifiers so anonymous callers cannot
        // use validation differences to probe protected attendance routes.
        await dependencies.authorise();
        if (!isEventId(eventId)) {
          return { code: "VALIDATION", ok: false };
        }

        const snapshot = await dependencies.repository.listForEvent(
          eventId.toLowerCase(),
        );
        if (!snapshot) return { code: "UNAVAILABLE", ok: false };
        if (
          snapshot.event.id.toLowerCase() !== eventId.toLowerCase() ||
          snapshot.items.some(
            (item) => item.eventId.toLowerCase() !== eventId.toLowerCase(),
          )
        ) {
          return { code: "SYSTEM_ERROR", ok: false };
        }

        return { ...snapshot, ok: true };
      } catch (error) {
        return failure(error);
      }
    },
  };
}

export const attendanceAuditService = createAttendanceAuditService({
  authorise: requireAuthorised,
  repository: createAttendanceAuditRepository(),
});
