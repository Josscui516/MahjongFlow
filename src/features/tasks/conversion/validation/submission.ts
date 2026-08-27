import type {
  TaskConversionField,
  TaskConversionFieldError,
  TaskConversionFormState,
  TaskConversionPort,
  TaskConversionRawValues,
  TaskConversionValidationOptions,
  TaskSourceContext,
} from "./contracts";
import {
  isValidTaskSourceContext,
  readTaskConversionFormData,
  validateTaskConversion,
} from "./validation";

const FIELD_LABELS: Record<TaskConversionField, string> = {
  assigneeId: "Primary assignee",
  description: "Description",
  dueDate: "Due date",
  status: "Status",
  title: "Task title",
};

function mapPortValidationErrors(
  errors:
    | readonly Readonly<{ field: TaskConversionField; message: string }>[]
    | undefined,
): readonly TaskConversionFieldError[] {
  if (!errors) return [];

  const mappedErrors: TaskConversionFieldError[] = [];
  const seenFields = new Set<TaskConversionField>();

  for (const error of errors) {
    if (seenFields.has(error.field)) continue;

    seenFields.add(error.field);
    mappedErrors.push({
      code: "FIELD_REJECTED",
      field: error.field,
      label: FIELD_LABELS[error.field],
      message: error.message.trim() || "Review this field and try again.",
    });
  }

  return mappedErrors;
}

export type TaskConversionSubmissionDependencies = Readonly<{
  port: TaskConversionPort;
  sourceContext: TaskSourceContext;
  validationOptions: TaskConversionValidationOptions;
}>;

export function createInitialTaskConversionState(
  sourceContext: TaskSourceContext,
  values: TaskConversionFormState["values"],
): TaskConversionFormState {
  return { errors: [], sourceContext, status: "idle", values };
}

export async function submitTaskConversion(
  dependencies: TaskConversionSubmissionDependencies,
  rawValues: TaskConversionRawValues,
): Promise<TaskConversionFormState> {
  const validation = validateTaskConversion(
    rawValues,
    dependencies.sourceContext,
    dependencies.validationOptions,
  );

  if (!validation.ok) {
    return {
      errors: validation.errors,
      sourceContext: validation.sourceContext,
      status: "validation",
      values: validation.values,
    };
  }

  if (!isValidTaskSourceContext(dependencies.sourceContext)) {
    return {
      errors: [],
      sourceContext: validation.sourceContext,
      status: "system-error",
      values: validation.values,
    };
  }

  try {
    const result = await dependencies.port.createFromSource(
      validation.draft.sourceContext,
      {
        assigneeId: validation.draft.assigneeId,
        description: validation.draft.description,
        dueDate: validation.draft.dueDate,
        status: validation.draft.status,
        title: validation.draft.title,
      },
    );

    if (result.ok) {
      return {
        errors: [],
        sourceContext: validation.sourceContext,
        status: "success",
        taskId: result.taskId,
        values: validation.values,
      };
    }

    if (result.code === "validation") {
      const errors = mapPortValidationErrors(result.errors);

      return {
        errors,
        sourceContext: validation.sourceContext,
        status: errors.length > 0 ? "validation" : "system-error",
        values: validation.values,
      };
    }

    const status = result.code === "duplicate"
      ? "duplicate"
      : result.code === "forbidden"
        ? "permission"
        : "system-error";

    return {
      errors: [],
      sourceContext: validation.sourceContext,
      status,
      values: validation.values,
    };
  } catch {
    return {
      errors: [],
      sourceContext: validation.sourceContext,
      status: "system-error",
      values: validation.values,
    };
  }
}

/**
 * Server actions should bind trusted source context and allowed assignees, then
 * delegate here. The browser only supplies editable task fields.
 */
export async function submitTaskConversionForm(
  dependencies: TaskConversionSubmissionDependencies,
  formData: FormData,
): Promise<TaskConversionFormState> {
  return submitTaskConversion(
    dependencies,
    readTaskConversionFormData(formData),
  );
}
