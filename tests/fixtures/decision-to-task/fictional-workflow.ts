import type { TaskRecordDTO } from "@/features/tasks/core/contracts";
import type {
  TaskConversionCreateInput,
  TaskConversionPort,
  TaskSourceContext,
  TaskSourceReader,
} from "@/features/tasks/conversion/source/contracts";
import type { SourceNavigationRepository } from "@/features/tasks/source-navigation/persistence";

export const DECISION_TO_TASK_FIXTURE = Object.freeze({
  actor: Object.freeze({
    canManageAccounts: false,
    role: "committee" as const,
    userId: "41000000-0000-4000-8000-000000000001",
  }),
  assigneeId: "41000000-0000-4000-8000-000000000002",
  decision: Object.freeze({
    meetingId: "42000000-0000-4000-8000-000000000001",
    sourceContent: "Approve the fictional community-hall booking.",
    sourceId: "43000000-0000-4000-8000-000000000001",
    sourceKind: "decision" as const,
  }),
  discussion: Object.freeze({
    meetingId: "42000000-0000-4000-8000-000000000001",
    sourceContent: "Compare two fictional equipment suppliers.",
    sourceId: "44000000-0000-4000-8000-000000000001",
    sourceKind: "discussion" as const,
  }),
  meetingTitle: "Fictional Spring Planning Meeting",
  task: Object.freeze({
    assigneeId: "41000000-0000-4000-8000-000000000002",
    description: "Confirm the fictional booking and record the result.",
    dueDate: "2026-09-04",
    status: "not_started" as const,
    title: "Confirm fictional venue",
  }),
});

type StoredTask = TaskRecordDTO;

function sourceKey(source: Pick<TaskSourceContext, "sourceId" | "sourceKind">) {
  return `${source.sourceKind}:${source.sourceId}`;
}

function toSourceFields(source: TaskSourceContext) {
  return {
    sourceDecisionId: source.sourceKind === "decision" ? source.sourceId : null,
    sourceDiscussionPointId:
      source.sourceKind === "discussion" ? source.sourceId : null,
    sourceMeetingId: source.meetingId,
  };
}

export function createFictionalDecisionToTaskWorkflow() {
  const sources = new Map<string, TaskSourceContext>([
    [sourceKey(DECISION_TO_TASK_FIXTURE.decision), DECISION_TO_TASK_FIXTURE.decision],
    [sourceKey(DECISION_TO_TASK_FIXTURE.discussion), DECISION_TO_TASK_FIXTURE.discussion],
  ]);
  const tasks: StoredTask[] = [];

  const sourceReader: TaskSourceReader = {
    async read(sourceKind, sourceId) {
      return sources.get(`${sourceKind}:${sourceId}`) ?? null;
    },
  };

  const conversionPort: TaskConversionPort = {
    async createFromSource(source, input: TaskConversionCreateInput) {
      const duplicate = tasks.find((task) =>
        source.sourceKind === "decision"
          ? task.sourceDecisionId === source.sourceId
          : task.sourceDiscussionPointId === source.sourceId,
      );

      if (duplicate) {
        return {
          code: "duplicate",
          message: "A task already exists for this source.",
          ok: false,
          source,
        };
      }

      const id = `45000000-0000-4000-8000-${String(tasks.length + 1).padStart(12, "0")}`;
      tasks.push({
        ...input,
        ...toSourceFields(source),
        createdAt: "2026-08-27T00:00:00.000Z",
        createdBy: DECISION_TO_TASK_FIXTURE.actor.userId,
        eventId: null,
        id,
        updatedAt: "2026-08-27T00:00:00.000Z",
      });

      return { ok: true, source, taskId: id };
    },
  };

  const navigationRepository: SourceNavigationRepository = {
    async listRelatedTasks(meetingId) {
      return tasks
        .filter((task) => task.sourceMeetingId === meetingId)
        .map((task) => ({
          id: task.id,
          sourceKind: task.sourceDecisionId ? "decision" : "discussion",
          title: task.title,
        }));
    },
    async readSource(meetingId, sourceKind, sourceId) {
      const source = sources.get(`${sourceKind}:${sourceId}`);
      if (!source || source.meetingId !== meetingId) return null;

      return {
        meetingId,
        meetingTitle: DECISION_TO_TASK_FIXTURE.meetingTitle,
        sourceContent: source.sourceContent,
        sourceKind,
      };
    },
  };

  return {
    conversionPort,
    navigationRepository,
    sourceReader,
    tasks,
  };
}
