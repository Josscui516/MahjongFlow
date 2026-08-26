import type {
  ConvertedTaskDraft,
  TaskConversionFieldError,
  TaskConversionFormValues,
  TaskConversionRawValues,
  TaskConversionValidationOptions,
  TaskConversionValidationResult,
  TaskSourceContext,
  TaskStatus,
} from "./contracts";
import { TASK_STATUSES } from "./contracts";

export const TASK_TITLE_MAX_LENGTH = 200;
export const TASK_DESCRIPTION_MAX_LENGTH = 10_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const FIELD_LABELS = {
  assigneeId: "Primary assignee",
  description: "Description",
  dueDate: "Due date",
  status: "Status",
  title: "Task title",
} as const;

function asDisplayValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === "string") ?? "";
  }
  return "";
}

function toFormValues(values: TaskConversionRawValues): TaskConversionFormValues {
  return {
    assigneeId: asDisplayValue(values.assigneeId),
    description: asDisplayValue(values.description),
    dueDate: asDisplayValue(values.dueDate),
    status: asDisplayValue(values.status),
    title: asDisplayValue(values.title),
  };
}

function isUuid(value: string): boolean {
  return UUID.test(value);
}

function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.some((status) => status === value);
}

function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function error(
  field: keyof typeof FIELD_LABELS,
  code: TaskConversionFieldError["code"],
  message: string,
): TaskConversionFieldError {
  return { code, field, label: FIELD_LABELS[field], message };
}

export function isValidTaskSourceContext(source: TaskSourceContext): boolean {
  return (
    isUuid(source.meetingId) &&
    isUuid(source.sourceId) &&
    (source.sourceKind === "decision" || source.sourceKind === "discussion") &&
    typeof source.sourceContent === "string"
  );
}

export function readTaskConversionFormData(
  formData: FormData,
): TaskConversionRawValues {
  const assigneeIds = formData.getAll("assigneeId");

  return {
    assigneeId:
      assigneeIds.length === 0
        ? null
        : assigneeIds.length === 1
          ? assigneeIds[0]
          : assigneeIds,
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status"),
    title: formData.get("title"),
  };
}

export function validateTaskConversion(
  rawValues: TaskConversionRawValues,
  sourceContext: TaskSourceContext,
  options: TaskConversionValidationOptions,
): TaskConversionValidationResult {
  const values = toFormValues(rawValues);
  const errors: TaskConversionFieldError[] = [];
  const title = values.title.trim();
  const description = values.description.trim();
  const assigneeId = values.assigneeId.trim();
  const dueDate = values.dueDate.trim();
  const status = values.status.trim();

  if (!title) {
    errors.push(error("title", "TITLE_REQUIRED", "Enter a task title."));
  } else if (title.length > TASK_TITLE_MAX_LENGTH) {
    errors.push(
      error("title", "TITLE_TOO_LONG", "Use no more than 200 characters."),
    );
  }

  if (!description) {
    errors.push(
      error("description", "DESCRIPTION_REQUIRED", "Enter a task description."),
    );
  } else if (description.length > TASK_DESCRIPTION_MAX_LENGTH) {
    errors.push(
      error(
        "description",
        "DESCRIPTION_TOO_LONG",
        "Use no more than 10,000 characters.",
      ),
    );
  }

  if (Array.isArray(rawValues.assigneeId)) {
    errors.push(
      error(
        "assigneeId",
        "ASSIGNEE_INVALID_CARDINALITY",
        "Choose exactly one primary assignee.",
      ),
    );
  } else if (!assigneeId) {
    errors.push(
      error("assigneeId", "ASSIGNEE_REQUIRED", "Choose a primary assignee."),
    );
  } else if (
    !isUuid(assigneeId) ||
    !options.allowedAssigneeIds.includes(assigneeId)
  ) {
    errors.push(
      error(
        "assigneeId",
        "ASSIGNEE_NOT_ALLOWED",
        "Choose an available committee member.",
      ),
    );
  }

  if (!dueDate) {
    errors.push(error("dueDate", "DUE_DATE_REQUIRED", "Choose a due date."));
  } else if (!isValidIsoDate(dueDate)) {
    errors.push(
      error("dueDate", "DUE_DATE_INVALID", "Choose a valid calendar date."),
    );
  }

  if (!status) {
    errors.push(error("status", "STATUS_REQUIRED", "Choose a task status."));
  } else if (!isTaskStatus(status)) {
    errors.push(
      error(
        "status",
        "STATUS_NOT_ALLOWED",
        "Choose an allowed task status.",
      ),
    );
  }

  if (errors.length > 0 || !isTaskStatus(status)) {
    return { errors, ok: false, sourceContext, values };
  }

  const draft: ConvertedTaskDraft = {
    assigneeId,
    description,
    dueDate,
    sourceContext,
    status,
    title,
  };

  return {
    draft,
    errors: [],
    ok: true,
    sourceContext,
    values: {
      assigneeId,
      description,
      dueDate,
      status,
      title,
    },
  };
}
