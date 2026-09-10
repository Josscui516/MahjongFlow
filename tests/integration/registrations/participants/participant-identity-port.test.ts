import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type {
  ParticipantIdentityDTO,
  ParticipantIdentityInput,
  TrustedEventRequirementPort,
} from "@/features/registrations/participants/contracts";
import {
  FICTIONAL_STANDARD_EVENT_REQUIREMENT,
  FICTIONAL_STUDENT_EVENT_REQUIREMENT,
} from "@/features/registrations/participants/fixtures";
import type {
  ParticipantRepository,
  ParticipantRepositoryResolution,
} from "@/features/registrations/participants/repository";
import { createParticipantIdentityService } from "@/features/registrations/participants/service";
import { AuthorizationError } from "@/lib/auth/authorization";

const FIXED_NOW = "2026-09-08T12:00:00.000Z";
const ACTOR_ID = "26900000-0000-4000-8000-000000000001";

function createFixtureRepository() {
  const records = new Map<string, ParticipantIdentityDTO>();
  let nextId = 1;

  const repository: ParticipantRepository = {
    async resolve(input: ParticipantIdentityInput) {
      const existing = records.get(input.email);

      if (existing) {
        if (
          input.studentId &&
          existing.studentId &&
          input.studentId !== existing.studentId
        ) {
          return { outcome: "conflict" };
        }

        const participant =
          input.studentId && !existing.studentId
            ? { ...existing, studentId: input.studentId, updatedAt: FIXED_NOW }
            : existing;
        records.set(input.email, participant);
        return {
          outcome: "matched",
          participant,
        } satisfies ParticipantRepositoryResolution;
      }

      const participant: ParticipantIdentityDTO = {
        createdAt: FIXED_NOW,
        email: input.email,
        fullName: input.fullName,
        id: `26100000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`,
        studentId: input.studentId,
        updatedAt: FIXED_NOW,
      };
      records.set(input.email, participant);

      return {
        outcome: "created",
        participant,
      } satisfies ParticipantRepositoryResolution;
    },
  };

  return { records, repository };
}

function createEventRequirements(): TrustedEventRequirementPort {
  const requirements = new Map<
    string,
    Readonly<{ eventId: string; requiresStudentId: boolean }>
  >(
    [
      FICTIONAL_STANDARD_EVENT_REQUIREMENT,
      FICTIONAL_STUDENT_EVENT_REQUIREMENT,
    ].map((requirement) => [requirement.eventId, requirement]),
  );

  return {
    async getStudentIdRequirement(eventId) {
      return requirements.get(eventId) ?? null;
    },
  };
}

function createService(repository: ParticipantRepository) {
  return createParticipantIdentityService({
    async authorise() {
      return {
        canManageAccounts: false,
        role: "authorised",
        userId: ACTOR_ID,
      };
    },
    eventRequirements: createEventRequirements(),
    repository,
  });
}

describe("participant identity port integration", () => {
  it("R-01 normalises and creates the minimum identity for an ordinary event", async () => {
    const fixture = createFixtureRepository();
    const service = createService(fixture.repository);

    const result = await service.resolveForEvent(
      FICTIONAL_STANDARD_EVENT_REQUIREMENT.eventId,
      {
        email: "  FICTIONAL.PLAYER@EXAMPLE.TEST  ",
        fullName: "  Fictional   Player  ",
        studentId: "",
      },
    );

    expect(result).toMatchObject({
      ok: true,
      outcome: "created",
      participant: {
        email: "fictional.player@example.test",
        fullName: "Fictional Player",
        studentId: null,
      },
    });
    expect(fixture.records.size).toBe(1);
  });

  it("R-02 rejects a missing required student ID before any persistence", async () => {
    const fixture = createFixtureRepository();
    const service = createService(fixture.repository);

    await expect(
      service.resolveForEvent(FICTIONAL_STUDENT_EVENT_REQUIREMENT.eventId, {
        email: "fictional.player@example.test",
        fullName: "Fictional Player",
        studentId: "",
      }),
    ).resolves.toMatchObject({
      code: "VALIDATION",
      errors: [{ code: "STUDENT_ID_REQUIRED", field: "studentId" }],
      ok: false,
    });
    expect(fixture.records.size).toBe(0);
  });

  it("matches concurrent case-variant submissions to one participant", async () => {
    const fixture = createFixtureRepository();
    const service = createService(fixture.repository);

    const results = await Promise.all([
      service.resolveForEvent(FICTIONAL_STANDARD_EVENT_REQUIREMENT.eventId, {
        email: "RIVER@EXAMPLE.TEST",
        fullName: "River Example",
        studentId: "",
      }),
      service.resolveForEvent(FICTIONAL_STANDARD_EVENT_REQUIREMENT.eventId, {
        email: " river@example.test ",
        fullName: "River Example",
        studentId: "",
      }),
    ]);

    expect(results.map((result) => result.ok && result.outcome).sort()).toEqual([
      "created",
      "matched",
    ]);
    expect(fixture.records.size).toBe(1);
  });

  it("R-06 drops forged unrelated fields at the validated port boundary", async () => {
    const fixture = createFixtureRepository();
    const service = createService(fixture.repository);

    await service.resolveForEvent(
      FICTIONAL_STANDARD_EVENT_REQUIREMENT.eventId,
      {
        email: "minimal@example.test",
        fullName: "Minimal Participant",
        studentId: "",
        phone: "+61 400 000 000",
        payment: "not retained",
      } as Parameters<typeof service.resolveForEvent>[1],
    );

    const [participant] = [...fixture.records.values()];
    expect(Object.keys(participant).sort()).toEqual([
      "createdAt",
      "email",
      "fullName",
      "id",
      "studentId",
      "updatedAt",
    ]);
    expect(JSON.stringify([...fixture.records.values()])).not.toMatch(
      /phone|payment/i,
    );
  });

  it("R-08 denies a non-authorised request before event or identity reads", async () => {
    const fixture = createFixtureRepository();
    const eventRequirements = createEventRequirements();
    const getStudentIdRequirement = vi.spyOn(
      eventRequirements,
      "getStudentIdRequirement",
    );
    const service = createParticipantIdentityService({
      async authorise() {
        throw new AuthorizationError("FORBIDDEN");
      },
      eventRequirements,
      repository: fixture.repository,
    });

    await expect(
      service.resolveForEvent(FICTIONAL_STANDARD_EVENT_REQUIREMENT.eventId, {
        email: "denied@example.test",
        fullName: "Denied Participant",
      }),
    ).resolves.toEqual({ code: "PERMISSION_DENIED", ok: false });
    expect(getStudentIdRequirement).not.toHaveBeenCalled();
    expect(fixture.records.size).toBe(0);
  });
});
