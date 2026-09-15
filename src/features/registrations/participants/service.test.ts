import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  AuthorizationError,
  type AccessContext,
} from "@/lib/auth/authorization";

import type {
  ParticipantIdentityRawInput,
  TrustedEventRequirementPort,
} from "./contracts";
import {
  FICTIONAL_PARTICIPANT,
  FICTIONAL_STANDARD_EVENT_REQUIREMENT,
  FICTIONAL_STUDENT_EVENT_REQUIREMENT,
} from "./fixtures";
import {
  ParticipantRepositoryError,
  type ParticipantRepository,
} from "./repository";
import {
  createParticipantIdentityService,
  type ParticipantIdentityDependencies,
} from "./service";

const AUTHORISED: AccessContext & Readonly<{ role: "authorised" }> = {
  canManageAccounts: false,
  displayName: "Fictional Authorised User",
  role: "authorised",
  userId: "26900000-0000-4000-8000-000000000001",
};

const RAW_INPUT: ParticipantIdentityRawInput = {
  email: "  CASEY.RIVER@EXAMPLE.TEST ",
  fullName: " Casey   River ",
  studentId: " TEST-2601 ",
};

function setup(
  overrides: Partial<ParticipantIdentityDependencies> = {},
) {
  const calls: string[] = [];
  const authorise = vi.fn(async () => {
    calls.push("authorise");
    return AUTHORISED;
  });
  const eventRequirements: TrustedEventRequirementPort = {
    getStudentIdRequirement: vi.fn(async () => {
      calls.push("event");
      return FICTIONAL_STUDENT_EVENT_REQUIREMENT;
    }),
  };
  const repository: ParticipantRepository = {
    resolve: vi.fn(async () => {
      calls.push("repository");
      return {
        outcome: "created" as const,
        participant: FICTIONAL_PARTICIPANT,
      };
    }),
  };
  const dependencies: ParticipantIdentityDependencies = {
    authorise,
    eventRequirements,
    repository,
    ...overrides,
  };

  return {
    calls,
    dependencies,
    eventRequirements: dependencies.eventRequirements,
    repository: dependencies.repository,
    service: createParticipantIdentityService(dependencies),
  };
}

describe("createParticipantIdentityService", () => {
  it("authorises, reads the trusted event requirement, validates, then persists", async () => {
    const context = setup();

    await expect(
      context.service.resolveForEvent(
        FICTIONAL_STUDENT_EVENT_REQUIREMENT.eventId,
        RAW_INPUT,
      ),
    ).resolves.toEqual({
      ok: true,
      outcome: "created",
      participant: FICTIONAL_PARTICIPANT,
    });
    expect(context.calls).toEqual(["authorise", "event", "repository"]);
    expect(context.repository.resolve).toHaveBeenCalledWith({
      email: FICTIONAL_PARTICIPANT.email,
      fullName: FICTIONAL_PARTICIPANT.fullName,
      studentId: FICTIONAL_PARTICIPANT.studentId,
    });
  });

  it.each([
    ["UNAUTHENTICATED", "UNAUTHENTICATED"],
    ["FORBIDDEN", "PERMISSION_DENIED"],
  ] as const)(
    "maps %s authorization failure before reading event or participant data",
    async (authorizationCode, expectedCode) => {
      const context = setup({
        authorise: vi.fn(async () => {
          throw new AuthorizationError(authorizationCode);
        }),
      });

      await expect(
        context.service.resolveForEvent(
          FICTIONAL_STUDENT_EVENT_REQUIREMENT.eventId,
          RAW_INPUT,
        ),
      ).resolves.toEqual({ code: expectedCode, ok: false });
      expect(
        context.eventRequirements.getStudentIdRequirement,
      ).not.toHaveBeenCalled();
      expect(context.repository.resolve).not.toHaveBeenCalled();
    },
  );

  it("returns unavailable for an unknown event before validating identity", async () => {
    const context = setup({
      eventRequirements: {
        getStudentIdRequirement: vi.fn(async () => null),
      },
    });

    await expect(
      context.service.resolveForEvent("unknown-event", {
        email: "invalid",
        fullName: "",
      }),
    ).resolves.toEqual({ code: "UNAVAILABLE", ok: false });
    expect(context.repository.resolve).not.toHaveBeenCalled();
  });

  it("rejects a provider response for another event as a contract failure", async () => {
    const context = setup({
      eventRequirements: {
        getStudentIdRequirement: vi.fn(async () =>
          FICTIONAL_STANDARD_EVENT_REQUIREMENT,
        ),
      },
    });

    await expect(
      context.service.resolveForEvent(
        FICTIONAL_STUDENT_EVENT_REQUIREMENT.eventId,
        RAW_INPUT,
      ),
    ).resolves.toEqual({ code: "SYSTEM_ERROR", ok: false });
    expect(context.repository.resolve).not.toHaveBeenCalled();
  });

  it("uses the trusted event flag rather than a browser-supplied assumption", async () => {
    const context = setup();

    const result = await context.service.resolveForEvent(
      FICTIONAL_STUDENT_EVENT_REQUIREMENT.eventId,
      { ...RAW_INPUT, studentId: "" },
    );

    expect(result).toEqual({
      code: "VALIDATION",
      errors: [
        expect.objectContaining({
          code: "STUDENT_ID_REQUIRED",
          field: "studentId",
        }),
      ],
      ok: false,
    });
    expect(context.repository.resolve).not.toHaveBeenCalled();
  });

  it("does not accept or persist a student ID for an ordinary event", async () => {
    const context = setup({
      eventRequirements: {
        getStudentIdRequirement: vi.fn(async () =>
          FICTIONAL_STANDARD_EVENT_REQUIREMENT,
        ),
      },
    });

    const result = await context.service.resolveForEvent(
      FICTIONAL_STANDARD_EVENT_REQUIREMENT.eventId,
      RAW_INPUT,
    );

    expect(result).toEqual({
      code: "VALIDATION",
      errors: [
        expect.objectContaining({ code: "STUDENT_ID_NOT_ALLOWED" }),
      ],
      ok: false,
    });
    expect(context.repository.resolve).not.toHaveBeenCalled();
  });

  it("omits a stored student ID from an ordinary-event result", async () => {
    const context = setup({
      eventRequirements: {
        getStudentIdRequirement: vi.fn(async () =>
          FICTIONAL_STANDARD_EVENT_REQUIREMENT,
        ),
      },
      repository: {
        resolve: vi.fn(async () => ({
          outcome: "matched" as const,
          participant: FICTIONAL_PARTICIPANT,
        })),
      },
    });

    await expect(
      context.service.resolveForEvent(
        FICTIONAL_STANDARD_EVENT_REQUIREMENT.eventId,
        { ...RAW_INPUT, studentId: "" },
      ),
    ).resolves.toEqual({
      ok: true,
      outcome: "matched",
      participant: { ...FICTIONAL_PARTICIPANT, studentId: null },
    });
  });

  it("maps a repository identity conflict to safe field feedback", async () => {
    const context = setup({
      repository: {
        resolve: vi.fn(async () => ({ outcome: "conflict" as const })),
      },
    });

    await expect(
      context.service.resolveForEvent(
        FICTIONAL_STUDENT_EVENT_REQUIREMENT.eventId,
        RAW_INPUT,
      ),
    ).resolves.toEqual({
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
    });
  });

  it("maps database permission errors and unknown failures to safe results", async () => {
    const permission = setup({
      repository: {
        resolve: vi.fn(async () => {
          throw new ParticipantRepositoryError("42501", "sensitive detail");
        }),
      },
    });
    const system = setup({
      eventRequirements: {
        getStudentIdRequirement: vi.fn(async () => {
          throw new Error("provider detail");
        }),
      },
    });

    await expect(
      permission.service.resolveForEvent(
        FICTIONAL_STUDENT_EVENT_REQUIREMENT.eventId,
        RAW_INPUT,
      ),
    ).resolves.toEqual({ code: "PERMISSION_DENIED", ok: false });
    await expect(
      system.service.resolveForEvent(
        FICTIONAL_STUDENT_EVENT_REQUIREMENT.eventId,
        RAW_INPUT,
      ),
    ).resolves.toEqual({ code: "SYSTEM_ERROR", ok: false });
  });
});
