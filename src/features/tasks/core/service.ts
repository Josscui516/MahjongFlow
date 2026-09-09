import "server-only";
import { AuthorizationError, requireBackendUser, type AccessContext } from "@/lib/auth/authorization";
import type { TaskDeleteResult, TaskEditorPort, TaskInput, TaskListResult, TaskMutationResult, TaskReadResult } from "./contracts";
import { createTaskRepository, TaskRepositoryError, type TaskRepository } from "./repository";
import { isTaskId, validateTaskInput } from "./validation";
import { queryTaskFollowUp } from "../list/projection";
import type { TaskFilterCriteria } from "../list/search-params";

type Dependencies = Readonly<{ authorise: () => Promise<AccessContext>; repository: TaskRepository }>;
function code(error: unknown) { return error instanceof AuthorizationError || (error instanceof TaskRepositoryError && ["42501", "PGRST301"].includes(error.code ?? "")) ? "PERMISSION_DENIED" as const : "SYSTEM_ERROR" as const; }
const DEFAULT_FILTERS: TaskFilterCriteria = { search: "", sort: "due_soonest", status: "all" };
export function createTaskService({ authorise, repository }: Dependencies): TaskEditorPort & Readonly<{ deleteTask: (taskId: string) => Promise<TaskDeleteResult>; listTasks: (criteria?: TaskFilterCriteria) => Promise<TaskListResult> }> {
  async function check(input: TaskInput) { const context = await authorise(); const validation = validateTaskInput(input); return validation.ok ? { context, ...validation } : validation; }
  return {
    async createTask(input): Promise<TaskMutationResult> { try { const checked = await check(input); return checked.ok ? { ok: true, record: await repository.create(checked.context.userId, checked.value) } : { code: "VALIDATION", errors: checked.errors, ok: false }; } catch (error) { return { code: code(error), ok: false }; } },
    async deleteTask(taskId): Promise<TaskDeleteResult> { try { await authorise(); if (!isTaskId(taskId)) return { code: "NOT_FOUND", ok: false }; return await repository.delete(taskId) === "deleted" ? { ok: true } : { code: "NOT_FOUND", ok: false }; } catch (error) { return { code: code(error), ok: false }; } },
    async getTask(taskId): Promise<TaskReadResult> { try { await authorise(); if (!isTaskId(taskId)) return { code: "NOT_FOUND", ok: false }; const record = await repository.get(taskId); return record ? { ok: true, record } : { code: "NOT_FOUND", ok: false }; } catch (error) { return { code: code(error), ok: false }; } },
    async listTasks(criteria = DEFAULT_FILTERS): Promise<TaskListResult> { try { await authorise(); return { ...queryTaskFollowUp(await repository.list(), criteria), ok: true }; } catch (error) { return { code: code(error), ok: false }; } },
    async updateTask(taskId, input): Promise<TaskMutationResult> { try { const checked = await check(input); if (!checked.ok) return { code: "VALIDATION", errors: checked.errors, ok: false }; if (!isTaskId(taskId)) return { code: "NOT_FOUND", ok: false }; const record = await repository.update(taskId, checked.value); return record ? { ok: true, record } : { code: "NOT_FOUND", ok: false }; } catch (error) { return { code: code(error), ok: false }; } },
  };
}
const service = createTaskService({ authorise: requireBackendUser, repository: createTaskRepository() });
export const createTask = service.createTask;
export const deleteTask = service.deleteTask;
export const getTask = service.getTask;
export const listTasks = service.listTasks;
export const updateTask = service.updateTask;
