"use server";

import { AuthorizationError } from "@/lib/auth/authorization";

import { listAssigneeOptions } from "../../editor/server";
import type { TaskSourceKind } from "../source/contracts";
import {
  createTaskConversionPort,
  createTaskSourceReader,
} from "../source/persistence";
import { resolveTaskSource } from "../source/service";
import type {
  TaskConversionFormState,
} from "./contracts";
import { submitTaskConversionForm } from "./submission";

function isTaskSourceKind(value: unknown): value is TaskSourceKind {
  return value === "decision" || value === "discussion";
}

function safeFailureState(
  previousState: TaskConversionFormState,
  status: "permission" | "system-error",
): TaskConversionFormState {
  return {
    ...previousState,
    errors: [],
    status,
    taskId: undefined,
  };
}

export async function submitTaskConversionAction(
  sourceKind: TaskSourceKind,
  sourceId: string,
  previousState: TaskConversionFormState,
  formData: FormData,
): Promise<TaskConversionFormState> {
  if (!isTaskSourceKind(sourceKind) || typeof sourceId !== "string") {
    return safeFailureState(previousState, "system-error");
  }

  try {
    const sourceContext = await resolveTaskSource(
      sourceKind,
      sourceId,
      createTaskSourceReader(),
    );
    if (!sourceContext) {
      return safeFailureState(previousState, "system-error");
    }

    const assigneeOptions = await listAssigneeOptions();

    return submitTaskConversionForm(
      {
        port: createTaskConversionPort(),
        sourceContext,
        validationOptions: {
          allowedAssigneeIds: assigneeOptions.map(({ id }) => id),
        },
      },
      formData,
    );
  } catch (error) {
    return safeFailureState(
      previousState,
      error instanceof AuthorizationError ? "permission" : "system-error",
    );
  }
}
