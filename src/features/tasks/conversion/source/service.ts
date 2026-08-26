import type {
  TaskConversionCreateInput,
  TaskConversionPort,
  TaskConversionResult,
  TaskSourceKind,
  TaskSourceReader,
} from "./contracts";
import { isTaskId, validateTaskInput } from "../../core/validation";

const conversionFields = new Set<keyof TaskConversionCreateInput>([
  "assigneeId",
  "description",
  "dueDate",
  "status",
  "title",
]);

export async function resolveTaskSource(
  sourceKind: TaskSourceKind,
  sourceId: string,
  reader: TaskSourceReader,
) {
  if (!isTaskId(sourceId)) return null;
  return reader.read(sourceKind, sourceId);
}

export async function convertTaskSource(
  sourceKind: TaskSourceKind,
  sourceId: string,
  input: TaskConversionCreateInput,
  reader: TaskSourceReader,
  port: TaskConversionPort,
): Promise<TaskConversionResult> {
  const source = await resolveTaskSource(sourceKind, sourceId, reader);

  if (!source) {
    return {
      ok: false,
      code: "source_missing",
      message: "The meeting source is unavailable.",
    };
  }

  const validation = validateTaskInput(input);
  if (!validation.ok) {
    return {
      ok: false,
      code: "validation",
      errors: validation.errors
        .filter((error) => conversionFields.has(error.field as keyof TaskConversionCreateInput))
        .map((error) => ({
          field: error.field as keyof TaskConversionCreateInput,
          message: error.message,
        })),
      message: "Check the highlighted task fields and try again.",
      source,
    };
  }

  return port.createFromSource(source, {
    assigneeId: validation.value.assigneeId,
    description: validation.value.description,
    dueDate: validation.value.dueDate,
    status: validation.value.status,
    title: validation.value.title,
  });
}
