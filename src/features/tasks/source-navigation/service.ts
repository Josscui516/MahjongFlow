import "server-only";

import {
  AuthorizationError,
  requireBackendUser,
  type AccessContext,
} from "@/lib/auth/authorization";

import type {
  SourceKindView,
  SourceNavigationReader,
  TaskSourceReference,
} from "./contracts";
import {
  createSourceNavigationRepository,
  SourceNavigationRepositoryError,
  type SourceNavigationRepository,
} from "./persistence";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Dependencies = Readonly<{
  authorise: () => Promise<AccessContext>;
  repository: SourceNavigationRepository;
}>;

function mapFailure(error: unknown) {
  return error instanceof AuthorizationError ||
    (error instanceof SourceNavigationRepositoryError &&
      ["42501", "PGRST301"].includes(error.code ?? ""))
    ? ({ code: "UNAVAILABLE", ok: false } as const)
    : ({ code: "SYSTEM_ERROR", ok: false } as const);
}

function getSourceReference(task: TaskSourceReference): Readonly<{
  meetingId: string;
  sourceId: string;
  sourceKind: SourceKindView;
}> | null | "invalid" {
  const decisionId = task.sourceDecisionId ?? null;
  const discussionId = task.sourceDiscussionPointId ?? null;
  const meetingId = task.sourceMeetingId ?? null;

  if (!meetingId && !decisionId && !discussionId) return null;
  if (!meetingId || Boolean(decisionId) === Boolean(discussionId)) return "invalid";

  const sourceId = decisionId ?? discussionId;
  if (!sourceId || !UUID.test(meetingId) || !UUID.test(sourceId)) return "invalid";

  return {
    meetingId,
    sourceId,
    sourceKind: decisionId ? "decision" : "discussion",
  };
}

export function createSourceNavigationService({
  authorise,
  repository,
}: Dependencies): SourceNavigationReader {
  return {
    async listRelatedTasks(meetingId) {
      try {
        await authorise();
        if (!UUID.test(meetingId)) return { code: "UNAVAILABLE", ok: false };
        return { items: await repository.listRelatedTasks(meetingId), ok: true };
      } catch (error) {
        return mapFailure(error);
      }
    },

    async readTaskSource(task) {
      try {
        await authorise();
        const reference = getSourceReference(task);
        if (reference === null) return { ok: true, source: null };
        if (reference === "invalid") return { code: "UNAVAILABLE", ok: false };

        const source = await repository.readSource(
          reference.meetingId,
          reference.sourceKind,
          reference.sourceId,
        );
        return source
          ? { ok: true, source }
          : { code: "UNAVAILABLE", ok: false };
      } catch (error) {
        return mapFailure(error);
      }
    },
  };
}

const service = createSourceNavigationService({
  authorise: requireBackendUser,
  repository: createSourceNavigationRepository(),
});

export const listRelatedTasks = service.listRelatedTasks;
export const readTaskSource = service.readTaskSource;
