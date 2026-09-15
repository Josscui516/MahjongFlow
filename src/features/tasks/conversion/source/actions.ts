"use server";
import { revalidatePath } from "next/cache";

import type {
  TaskConversionCreateInput,
  TaskConversionResult,
  TaskSourceKind,
} from "./contracts";
import { createTaskConversionPort, createTaskSourceReader } from "./persistence";
import { convertTaskSource } from "./service";

function isTaskSourceKind(value: unknown): value is TaskSourceKind {
  return value === "decision" || value === "discussion";
}

function isTaskConversionCreateInput(value: unknown): value is TaskConversionCreateInput {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.assigneeId === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.dueDate === "string" &&
    (candidate.status === "not_started" || candidate.status === "in_progress" || candidate.status === "completed") &&
    typeof candidate.title === "string"
  );
}

export async function convertTaskSourceAction(
  sourceKind: TaskSourceKind,
  sourceId: string,
  input: TaskConversionCreateInput,
): Promise<TaskConversionResult> {
  if (!isTaskSourceKind(sourceKind) || typeof sourceId !== "string") {
    return {
      ok: false,
      code: "source_missing",
      message: "The meeting source is unavailable.",
    };
  }
  if (!isTaskConversionCreateInput(input)) {
    return {
      ok: false,
      code: "validation",
      message: "Check the task fields and try again.",
    };
  }

  const result = await convertTaskSource(
    sourceKind,
    sourceId,
    input,
    createTaskSourceReader(),
    createTaskConversionPort(),
  );
  if (result.ok) {
    revalidatePath("/tasks", "layout");
    revalidatePath("/dashboard");
  }
  return result;
}
