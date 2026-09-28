import "server-only";

import { AuthorizationError, requireAuthorised, type AccessContext } from "@/lib/auth/authorization";
import type { ManualAttendancePort, ManualAttendanceState } from "./contracts";
import { createManualAttendanceRepository, ManualAttendanceRepositoryError, type ManualAttendanceRepository } from "./repository";
import { validateManualAttendance } from "./validation";

export type ManualAttendanceDependencies = Readonly<{
  authorise: () => Promise<AccessContext & Readonly<{ role: "authorised" }>>;
  repository: ManualAttendanceRepository;
}>;

function failure(error: unknown): ManualAttendanceState {
  if (error instanceof AuthorizationError) {
    return { status: error.code === "UNAUTHENTICATED" ? "unauthenticated" : "permission-denied" };
  }
  if (error instanceof ManualAttendanceRepositoryError) {
    if (["42501", "PGRST301"].includes(error.code ?? "")) return { status: "permission-denied" };
    if (error.code === "23505") return { status: "duplicate" };
    if (error.code === "23503") return { status: "unavailable" };
    if (["23514", "22P02", "22007", "22008"].includes(error.code ?? "")) {
      return { status: "validation", errors: [{ field: "operation", message: "The attendance change is invalid. Refresh the records and check your selection." }] };
    }
    // A rolled-back serialization/deadlock failure is retryable after reconfirming.
    // Reserve conflict for a failed CAS: the UI then requires a new row version.
  }
  return { status: "system-error" };
}

export function createManualAttendanceService(dependencies: ManualAttendanceDependencies): ManualAttendancePort {
  return {
    async submit(eventId, formData) {
      try {
        // Authenticate before parsing any attacker-controlled input or reading data.
        await dependencies.authorise();
        const validation = validateManualAttendance(eventId, formData);
        if (!validation.ok) return { status: "validation", errors: validation.errors };
        const result = await dependencies.repository.execute(validation.command);
        if (result.outcome === "participant-missing") {
          return { status: "validation", errors: [{ field: "email", message: "No existing participant matches that email. Check the participant details first." }] };
        }
        if (result.outcome !== "updated") return { status: result.outcome };
        if (result.eventId !== validation.command.eventId) return { status: "system-error" };
        return { status: "success", eventId: result.eventId, updatedAt: result.updatedAt };
      } catch (error) {
        return failure(error);
      }
    },
  };
}

export const manualAttendanceService = createManualAttendanceService({
  authorise: requireAuthorised,
  repository: createManualAttendanceRepository(),
});
