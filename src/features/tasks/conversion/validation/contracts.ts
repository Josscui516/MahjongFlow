import {
  TASK_STATUSES,
  type TaskStatus,
} from "../../core/contracts";
import type {
  TaskConversionPort as SourceTaskConversionPort,
  TaskSourceContext,
} from "../source/contracts";

export { TASK_STATUSES };
export type { TaskSourceContext, TaskStatus };

export type TaskAssigneeOption = Readonly<{
  id: string;
  label: string;
}>;

export type TaskConversionField =
  | "title"
  | "description"
  | "assigneeId"
  | "dueDate"
  | "status";

export type TaskConversionErrorCode =
  | "FIELD_REJECTED"
  | "TITLE_REQUIRED"
  | "TITLE_TOO_LONG"
  | "DESCRIPTION_REQUIRED"
  | "DESCRIPTION_TOO_LONG"
  | "ASSIGNEE_REQUIRED"
  | "ASSIGNEE_INVALID_CARDINALITY"
  | "ASSIGNEE_NOT_ALLOWED"
  | "DUE_DATE_REQUIRED"
  | "DUE_DATE_INVALID"
  | "STATUS_REQUIRED"
  | "STATUS_NOT_ALLOWED";

export type TaskConversionFieldError = Readonly<{
  code: TaskConversionErrorCode;
  field: TaskConversionField;
  label: string;
  message: string;
}>;

export type TaskConversionFormValues = Readonly<{
  assigneeId: string;
  description: string;
  dueDate: string;
  status: string;
  title: string;
}>;

export type TaskConversionRawValues = Readonly<{
  assigneeId: unknown;
  description: unknown;
  dueDate: unknown;
  status: unknown;
  title: unknown;
}>;

export type ConvertedTaskDraft = Readonly<{
  assigneeId: string;
  description: string;
  dueDate: string;
  sourceContext: TaskSourceContext;
  status: TaskStatus;
  title: string;
}>;

export type TaskConversionValidationResult =
  | Readonly<{
      draft: ConvertedTaskDraft;
      errors: readonly [];
      ok: true;
      sourceContext: TaskSourceContext;
      values: TaskConversionFormValues;
    }>
  | Readonly<{
      errors: readonly TaskConversionFieldError[];
      ok: false;
      sourceContext: TaskSourceContext;
      values: TaskConversionFormValues;
    }>;

export type TaskConversionValidationOptions = Readonly<{
  allowedAssigneeIds: readonly string[];
}>;

/**
 * Reuse the source workflow port instead of maintaining a second persistence
 * contract. The validation boundary supplies its trusted source and validated
 * editable fields separately.
 */
export type TaskConversionPort = SourceTaskConversionPort;

export type TaskConversionSubmissionStatus =
  | "idle"
  | "duplicate"
  | "permission"
  | "success"
  | "system-error"
  | "validation";

export type TaskConversionFormState = Readonly<{
  errors: readonly TaskConversionFieldError[];
  sourceContext: TaskSourceContext;
  status: TaskConversionSubmissionStatus;
  taskId?: string;
  values: TaskConversionFormValues;
}>;

export type TaskConversionAction = (
  previousState: TaskConversionFormState,
  formData: FormData,
) => Promise<TaskConversionFormState>;
