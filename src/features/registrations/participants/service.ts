import "server-only";

import {
  AuthorizationError,
  requireAuthorised,
  type AccessContext,
} from "@/lib/auth/authorization";

import type {
  ParticipantIdentityFailure,
  ParticipantIdentityPort,
  TrustedEventRequirementPort,
} from "./contracts";
import {
  createParticipantRepository,
  ParticipantRepositoryError,
  type ParticipantRepository,
} from "./repository";
import { validateParticipantIdentity } from "./validation";

type AuthorisedAccessContext = AccessContext & Readonly<{ role: "authorised" }>;

export type ParticipantIdentityDependencies = Readonly<{
  authorise: () => Promise<AuthorisedAccessContext>;
  eventRequirements: TrustedEventRequirementPort;
  repository: ParticipantRepository;
}>;

function failure(error: unknown): ParticipantIdentityFailure {
  if (error instanceof AuthorizationError) {
    return {
      code:
        error.code === "UNAUTHENTICATED"
          ? "UNAUTHENTICATED"
          : "PERMISSION_DENIED",
      ok: false,
    };
  }

  if (
    error instanceof ParticipantRepositoryError &&
    ["42501", "PGRST301"].includes(error.code ?? "")
  ) {
    return { code: "PERMISSION_DENIED", ok: false };
  }

  return { code: "SYSTEM_ERROR", ok: false };
}

export function createParticipantIdentityService(
  dependencies: ParticipantIdentityDependencies,
): ParticipantIdentityPort {
  return {
    async resolveForEvent(eventId, input) {
      try {
        await dependencies.authorise();

        const requirement =
          await dependencies.eventRequirements.getStudentIdRequirement(eventId);

        if (!requirement) return { code: "UNAVAILABLE", ok: false };
        if (requirement.eventId !== eventId) {
          return { code: "SYSTEM_ERROR", ok: false };
        }

        const validation = validateParticipantIdentity(input, {
          requiresStudentId: requirement.requiresStudentId,
        });

        if (!validation.ok) {
          return {
            code: "VALIDATION",
            errors: validation.errors,
            ok: false,
          };
        }

        const resolution = await dependencies.repository.resolve(
          validation.value,
        );

        if (resolution.outcome === "conflict") {
          return {
            code: "VALIDATION",
            errors: [
              {
                code: "STUDENT_ID_CONFLICT",
                field: "studentId",
                label: "Student ID",
                message:
                  "The student ID cannot be matched to these participant details.",
              },
            ],
            ok: false,
          };
        }

        return {
          ok: true,
          outcome: resolution.outcome,
          participant: requirement.requiresStudentId
            ? resolution.participant
            : { ...resolution.participant, studentId: null },
        };
      } catch (error) {
        return failure(error);
      }
    },
  };
}

/**
 * Production composition keeps authorisation and persistence fixed while the
 * #17 event adapter remains explicit. This prevents consumers from trusting a
 * browser-supplied requiresStudentId flag or forgetting the authorised guard.
 */
export function createAuthorisedParticipantIdentityPort(
  eventRequirements: TrustedEventRequirementPort,
  repository: ParticipantRepository = createParticipantRepository(),
): ParticipantIdentityPort {
  return createParticipantIdentityService({
    authorise: requireAuthorised,
    eventRequirements,
    repository,
  });
}
