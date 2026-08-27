import type {
  TaskAssigneeOption,
  TaskConversionFormValues,
  TaskSourceContext,
} from "./contracts";

export const FIXTURE_ASSIGNEE_ID = "11111111-1111-4111-8111-111111111111";
export const FIXTURE_MEETING_ID = "22222222-2222-4222-8222-222222222222";
export const FIXTURE_DECISION_ID = "33333333-3333-4333-8333-333333333333";

export const FIXTURE_ASSIGNEES: readonly TaskAssigneeOption[] = [
  { id: FIXTURE_ASSIGNEE_ID, label: "Alex Example" },
];

export const FIXTURE_SOURCE_CONTEXT: TaskSourceContext = {
  meetingId: FIXTURE_MEETING_ID,
  sourceContent: "Approve the fictional venue for the demonstration event.",
  sourceId: FIXTURE_DECISION_ID,
  sourceKind: "decision",
};

export const FIXTURE_TASK_VALUES: TaskConversionFormValues = {
  assigneeId: FIXTURE_ASSIGNEE_ID,
  description: "Prepare the fictional venue confirmation for review.",
  dueDate: "2026-09-04",
  status: "not_started",
  title: "Confirm fictional venue",
};
