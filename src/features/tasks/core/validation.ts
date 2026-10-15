import { TASK_STATUSES, type TaskInput, type TaskValidationError } from "./contracts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const isTaskId = (value: string): boolean => UUID.test(value);

export function validateTaskInput(input: TaskInput) {
  const errors: TaskValidationError[] = [];
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || title.length > 200) errors.push({ field: "title", message: !title ? "Enter a task title." : "Use 200 characters or fewer for the title." });
  if (!description || description.length > 10_000) errors.push({ field: "description", message: !description ? "Enter a task description." : "Use 10000 characters or fewer for the description." });
  if (!UUID.test(input.assigneeId)) errors.push({ field: "assigneeId", message: "Choose an assignee." });
  if (!DATE.test(input.dueDate) || Number.isNaN(Date.parse(`${input.dueDate}T00:00:00Z`))) errors.push({ field: "dueDate", message: "Enter a valid due date." });
  if (!(TASK_STATUSES as readonly string[]).includes(input.status)) errors.push({ field: "status", message: "Select a valid task status." });
  const optionalIds = ["eventId", "sourceMeetingId", "sourceDecisionId", "sourceDiscussionPointId"] as const;
  for (const field of optionalIds) if (input[field] && !UUID.test(input[field]!)) errors.push({ field, message: "Select a valid linked record." });
  if ((input.sourceDecisionId || input.sourceDiscussionPointId) && !input.sourceMeetingId) errors.push({ field: "sourceMeetingId", message: "A source meeting is required for a decision or discussion point." });
  if (input.sourceDecisionId && input.sourceDiscussionPointId) errors.push({ field: "sourceDecisionId", message: "Choose either a decision or a discussion point, not both." });
  if (input.meetingIds !== undefined && (!Array.isArray(input.meetingIds)
    || input.meetingIds.length > 100 || input.meetingIds.some(id => typeof id !== "string" || !UUID.test(id)))) {
    errors.push({ field: "meetingIds", message: "Choose up to 100 valid meetings." });
  }
  if (errors.length) return { errors, ok: false as const };
  return { ok: true as const, value: { ...input, description, title, ...(input.meetingIds !== undefined ? { meetingIds: [...new Set(input.meetingIds)] } : {}) } };
}
