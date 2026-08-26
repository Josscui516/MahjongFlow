import { AuthorizationError } from "@/lib/auth/authorization";
import { createTaskService } from "@/features/tasks/core/service";
import { resolveTaskSource } from "@/features/tasks/conversion/source/service";
import { submitTaskConversion } from "@/features/tasks/conversion/validation/submission";
import { createSourceNavigationService } from "@/features/tasks/source-navigation/service";
import {
  getMeetingHref,
  getTaskHref,
} from "@/features/tasks/source-navigation/presentation";
import {
  createFictionalDecisionToTaskWorkflow,
  DECISION_TO_TASK_FIXTURE,
} from "../../fixtures/decision-to-task/fictional-workflow";
import type { DecisionToTaskAdapterRegistry } from "./contracts";

function validRawTask() {
  return { ...DECISION_TO_TASK_FIXTURE.task };
}

async function createConvertedDecisionTask() {
  const workflow = createFictionalDecisionToTaskWorkflow();
  const result = await submitTaskConversion(
    {
      port: workflow.conversionPort,
      sourceContext: DECISION_TO_TASK_FIXTURE.decision,
      validationOptions: {
        allowedAssigneeIds: [DECISION_TO_TASK_FIXTURE.assigneeId],
      },
    },
    validRawTask(),
  );
  return { result, workflow };
}

export function createDecisionToTaskIntegrationAdapters(): DecisionToTaskAdapterRegistry {
  return {
    "C-01": async () => {
      const workflow = createFictionalDecisionToTaskWorkflow();
      const source = await resolveTaskSource(
        "decision",
        DECISION_TO_TASK_FIXTURE.decision.sourceId,
        workflow.sourceReader,
      );
      return {
        passed:
          source?.meetingId === DECISION_TO_TASK_FIXTURE.decision.meetingId &&
          source.sourceContent === DECISION_TO_TASK_FIXTURE.decision.sourceContent,
        summary: "The decision entry resolves trusted meeting and decision context.",
      };
    },
    "C-02": async () => {
      const { result, workflow } = await createConvertedDecisionTask();
      const task = workflow.tasks[0];
      return {
        passed:
          result.status === "success" &&
          workflow.tasks.length === 1 &&
          task?.sourceMeetingId === DECISION_TO_TASK_FIXTURE.decision.meetingId &&
          task.sourceDecisionId === DECISION_TO_TASK_FIXTURE.decision.sourceId &&
          task.sourceDiscussionPointId === null &&
          task.title === DECISION_TO_TASK_FIXTURE.task.title,
        summary: "A valid decision conversion creates exactly one fully sourced task.",
      };
    },
    "C-03": async () => {
      const workflow = createFictionalDecisionToTaskWorkflow();
      const result = await submitTaskConversion(
        {
          port: workflow.conversionPort,
          sourceContext: DECISION_TO_TASK_FIXTURE.decision,
          validationOptions: {
            allowedAssigneeIds: [DECISION_TO_TASK_FIXTURE.assigneeId],
          },
        },
        { ...validRawTask(), assigneeId: "", dueDate: "" },
      );
      return {
        passed:
          result.status === "validation" &&
          result.sourceContext === DECISION_TO_TASK_FIXTURE.decision &&
          result.errors.some(({ code }) => code === "ASSIGNEE_REQUIRED") &&
          result.errors.some(({ code }) => code === "DUE_DATE_REQUIRED") &&
          workflow.tasks.length === 0,
        summary: "Missing required fields preserve source context and create no task.",
      };
    },
    "C-04": async () => {
      const { result, workflow } = await createConvertedDecisionTask();
      if (result.status !== "success" || !result.taskId) {
        return { passed: false, summary: "The navigation fixture task was not created." };
      }
      const navigation = createSourceNavigationService({
        authorise: async () => DECISION_TO_TASK_FIXTURE.actor,
        repository: workflow.navigationRepository,
      });
      const [related, source] = await Promise.all([
        navigation.listRelatedTasks(DECISION_TO_TASK_FIXTURE.decision.meetingId),
        navigation.readTaskSource(workflow.tasks[0]!),
      ]);
      return {
        passed:
          related.ok &&
          related.items[0]?.id === result.taskId &&
          source.ok &&
          source.source?.sourceContent === DECISION_TO_TASK_FIXTURE.decision.sourceContent &&
          getTaskHref(result.taskId) === `/tasks/${result.taskId}` &&
          getMeetingHref(DECISION_TO_TASK_FIXTURE.decision.meetingId) ===
            `/meetings/${DECISION_TO_TASK_FIXTURE.decision.meetingId}`,
        summary: "Meeting and task projections provide safe bidirectional source navigation.",
      };
    },
    "C-05": async () => {
      const workflow = createFictionalDecisionToTaskWorkflow();
      const source = await resolveTaskSource(
        "discussion",
        DECISION_TO_TASK_FIXTURE.discussion.sourceId,
        workflow.sourceReader,
      );
      if (!source) return { passed: false, summary: "Discussion context was unavailable." };
      const result = await workflow.conversionPort.createFromSource(
        source,
        DECISION_TO_TASK_FIXTURE.task,
      );
      const task = workflow.tasks[0];
      return {
        passed:
          result.ok &&
          task?.sourceMeetingId === DECISION_TO_TASK_FIXTURE.discussion.meetingId &&
          task.sourceDecisionId === null &&
          task.sourceDiscussionPointId === DECISION_TO_TASK_FIXTURE.discussion.sourceId,
        summary: "Discussion conversion persists its meeting and only the discussion source.",
      };
    },
    "C-06": async () => {
      const workflow = createFictionalDecisionToTaskWorkflow();
      const result = await submitTaskConversion(
        {
          port: workflow.conversionPort,
          sourceContext: DECISION_TO_TASK_FIXTURE.decision,
          validationOptions: {
            allowedAssigneeIds: [DECISION_TO_TASK_FIXTURE.assigneeId],
          },
        },
        {
          ...validRawTask(),
          assigneeId: [
            DECISION_TO_TASK_FIXTURE.assigneeId,
            "41000000-0000-4000-8000-000000000003",
          ],
        },
      );
      return {
        passed:
          result.status === "validation" &&
          result.errors.some(({ code }) => code === "ASSIGNEE_INVALID_CARDINALITY") &&
          workflow.tasks.length === 0,
        summary: "A repeated primary-assignee payload is rejected before persistence.",
      };
    },
    "C-07": async () => {
      let repositoryCalls = 0;
      const service = createTaskService({
        authorise: async () => {
          throw new AuthorizationError("UNAUTHENTICATED");
        },
        repository: {
          async create() {
            repositoryCalls += 1;
            throw new Error("unexpected persistence");
          },
          async get() {
            repositoryCalls += 1;
            return null;
          },
          async list() {
            repositoryCalls += 1;
            return [];
          },
          async update() {
            repositoryCalls += 1;
            return null;
          },
        },
      });
      const result = await service.createTask(DECISION_TO_TASK_FIXTURE.task);
      return {
        passed:
          !result.ok &&
          result.code === "PERMISSION_DENIED" &&
          repositoryCalls === 0,
        summary: "Anonymous task creation is denied before the persistence boundary.",
      };
    },
  };
}
