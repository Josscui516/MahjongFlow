"use server";
import type { TaskDeleteResult, TaskInput, TaskMutationResult } from "../core/contracts";
import { createTask, deleteTask, updateTask } from "../core/service";
export async function createTaskAction(input: TaskInput): Promise<TaskMutationResult> { return createTask(input); }
export async function deleteTaskAction(taskId: string): Promise<TaskDeleteResult> { return deleteTask(taskId); }
export async function updateTaskAction(taskId: string, input: TaskInput): Promise<TaskMutationResult> { return updateTask(taskId, input); }
