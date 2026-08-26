import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { AuthorizationError } from "@/lib/auth/authorization";

import type { SourceNavigationRepository } from "./persistence";
import { SourceNavigationRepositoryError } from "./persistence";
import { createSourceNavigationService } from "./service";

const actorId = "11111111-1111-4111-8111-111111111111";
const meetingId = "22222222-2222-4222-8222-222222222222";
const decisionId = "33333333-3333-4333-8333-333333333333";
const discussionId = "44444444-4444-4444-8444-444444444444";

const authorise = async () => ({
  canManageAccounts: false,
  role: "committee" as const,
  userId: actorId,
});

function repository(
  overrides: Partial<SourceNavigationRepository> = {},
): SourceNavigationRepository {
  return {
    listRelatedTasks: vi.fn(async () => [
      { id: decisionId, sourceKind: "decision" as const, title: "Confirm fictional booking" },
      { id: discussionId, sourceKind: "discussion" as const, title: "Prepare fictional checklist" },
    ]),
    readSource: vi.fn(async (_meetingId, sourceKind) => ({
      meetingId,
      meetingTitle: "Fictional planning meeting",
      sourceContent: "Approve the fictional venue booking.",
      sourceKind,
    })),
    ...overrides,
  };
}

describe("source navigation service", () => {
  it("lists minimal related-task projections for an authorised meeting", async () => {
    const persistence = repository();
    const service = createSourceNavigationService({ authorise, repository: persistence });

    await expect(service.listRelatedTasks(meetingId)).resolves.toMatchObject({
      items: [
        { sourceKind: "decision", title: "Confirm fictional booking" },
        { sourceKind: "discussion", title: "Prepare fictional checklist" },
      ],
      ok: true,
    });
    expect(persistence.listRelatedTasks).toHaveBeenCalledWith(meetingId);
  });

  it("allows the authorised backend role to read the same coordination projection", async () => {
    const persistence = repository();
    const service = createSourceNavigationService({
      authorise: async () => ({
        canManageAccounts: false,
        role: "authorised",
        userId: actorId,
      }),
      repository: persistence,
    });

    await expect(service.listRelatedTasks(meetingId)).resolves.toMatchObject({
      ok: true,
    });
  });

  it("resolves decision and discussion references without accepting browser source content", async () => {
    const persistence = repository();
    const service = createSourceNavigationService({ authorise, repository: persistence });

    await expect(
      service.readTaskSource({
        sourceDecisionId: decisionId,
        sourceMeetingId: meetingId,
      }),
    ).resolves.toMatchObject({ ok: true, source: { sourceKind: "decision" } });
    await expect(
      service.readTaskSource({
        sourceDiscussionPointId: discussionId,
        sourceMeetingId: meetingId,
      }),
    ).resolves.toMatchObject({ ok: true, source: { sourceKind: "discussion" } });

    expect(persistence.readSource).toHaveBeenNthCalledWith(
      1,
      meetingId,
      "decision",
      decisionId,
    );
    expect(persistence.readSource).toHaveBeenNthCalledWith(
      2,
      meetingId,
      "discussion",
      discussionId,
    );
  });

  it("returns a safe empty result for a task without a meeting source", async () => {
    const persistence = repository();
    const service = createSourceNavigationService({ authorise, repository: persistence });

    await expect(service.readTaskSource({})).resolves.toEqual({
      ok: true,
      source: null,
    });
    expect(persistence.readSource).not.toHaveBeenCalled();
  });

  it("collapses malformed, missing, and forbidden sources to UNAVAILABLE", async () => {
    const missingRepository = repository({ readSource: vi.fn(async () => null) });
    const missingService = createSourceNavigationService({
      authorise,
      repository: missingRepository,
    });

    await expect(
      missingService.readTaskSource({
        sourceDecisionId: decisionId,
        sourceDiscussionPointId: discussionId,
        sourceMeetingId: meetingId,
      }),
    ).resolves.toEqual({ code: "UNAVAILABLE", ok: false });
    await expect(
      missingService.readTaskSource({
        sourceDecisionId: decisionId,
        sourceMeetingId: meetingId,
      }),
    ).resolves.toEqual({ code: "UNAVAILABLE", ok: false });

    for (const code of ["UNAUTHENTICATED", "FORBIDDEN"] as const) {
      const deniedRepository = repository();
      const deniedService = createSourceNavigationService({
        authorise: async () => {
          throw new AuthorizationError(code);
        },
        repository: deniedRepository,
      });
      await expect(deniedService.listRelatedTasks(meetingId)).resolves.toEqual({
        code: "UNAVAILABLE",
        ok: false,
      });
      expect(deniedRepository.listRelatedTasks).not.toHaveBeenCalled();
    }
  });

  it("maps provider failures without exposing their details", async () => {
    const permissionService = createSourceNavigationService({
      authorise,
      repository: repository({
        listRelatedTasks: async () => {
          throw new SourceNavigationRepositoryError("42501");
        },
      }),
    });
    const systemService = createSourceNavigationService({
      authorise,
      repository: repository({
        listRelatedTasks: async () => {
          throw new Error("SQL provider detail");
        },
      }),
    });

    await expect(permissionService.listRelatedTasks(meetingId)).resolves.toEqual({
      code: "UNAVAILABLE",
      ok: false,
    });
    await expect(systemService.listRelatedTasks(meetingId)).resolves.toEqual({
      code: "SYSTEM_ERROR",
      ok: false,
    });
  });
});
