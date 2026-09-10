"use server";
import { revalidatePath } from "next/cache";
function refreshViews() { revalidatePath("/tasks", "layout"); revalidatePath("/events", "layout"); revalidatePath("/dashboard"); }
import type { TaskDeleteResult, TaskInput, TaskMutationResult } from "../core/contracts";
import { createTask, deleteTask, updateTask } from "../core/service";
export async function createTaskAction(input: TaskInput): Promise<TaskMutationResult> { const result = await createTask(input); if (result.ok) refreshViews(); return result; }
export async function deleteTaskAction(taskId: string): Promise<TaskDeleteResult> { const result = await deleteTask(taskId); if (result.ok) refreshViews(); return result; }
export async function updateTaskAction(taskId: string, input: TaskInput): Promise<TaskMutationResult> { const result = await updateTask(taskId, input); if (result.ok) refreshViews(); return result; }
