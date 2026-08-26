"use server";
import type { TaskInput, TaskMutationResult } from "../core/contracts";
import { createTask, updateTask } from "../core/service";
export async function createTaskAction(input: TaskInput): Promise<TaskMutationResult> { return createTask(input); }
export async function updateTaskAction(taskId: string, input: TaskInput): Promise<TaskMutationResult> { return updateTask(taskId, input); }
