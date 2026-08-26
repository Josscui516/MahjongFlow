import { describe, expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { AuthorizationError } from "@/lib/auth/authorization";
import type { TaskInput, TaskRecordDTO } from "./contracts";
import type { TaskRepository } from "./repository";
import { createTaskService } from "./service";
const actorId = "11111111-1111-4111-8111-111111111111", taskId = "22222222-2222-4222-8222-222222222222";
const input: TaskInput = { assigneeId: actorId, description: "Fictional follow-up.", dueDate: "2026-08-31", status: "not_started", title: "Prepare fictional report" };
const record: TaskRecordDTO = { ...input, createdAt: "2026-08-26T00:00:00Z", createdBy: actorId, id: taskId, updatedAt: "2026-08-26T00:00:00Z" };
const repo = (overrides: Partial<TaskRepository> = {}): TaskRepository => ({ create: vi.fn(async () => record), get: vi.fn(async () => record), list: vi.fn(async () => [record]), update: vi.fn(async (_id, value) => ({ ...record, ...value })), ...overrides });
const context = async () => ({ canManageAccounts: false, role: "committee" as const, userId: actorId });
describe("task core service", () => {
  test("T-01 creates, reads, updates and reloads identical data", async () => { const store = new Map<string, TaskRecordDTO>(); const repository = repo({ create: async (_actor, value) => { const created = { ...record, ...value }; store.set(taskId, created); return created; }, get: async (id) => store.get(id) ?? null, update: async (id, value) => { const updated = { ...record, ...value }; store.set(id, updated); return updated; } }); const service = createTaskService({ authorise: context, repository }); const created = await service.createTask(input); expect(created).toMatchObject({ ok: true }); const changed = { ...input, status: "completed" as const }; expect(await service.updateTask(taskId, changed)).toMatchObject({ ok: true, record: { status: "completed" } }); expect(await service.getTask(taskId)).toMatchObject({ ok: true, record: { status: "completed" } }); });
  test("T-08 denies anonymous reads and writes before persistence", async () => { const repository = repo(); const service = createTaskService({ authorise: async () => { throw new AuthorizationError("UNAUTHENTICATED"); }, repository }); expect(await service.getTask(taskId)).toEqual({ code: "PERMISSION_DENIED", ok: false }); expect(await service.createTask(input)).toEqual({ code: "PERMISSION_DENIED", ok: false }); expect(repository.get).not.toHaveBeenCalled(); expect(repository.create).not.toHaveBeenCalled(); });
  test("rejects malformed identifiers and invalid input", async () => { const repository = repo(); const service = createTaskService({ authorise: context, repository }); expect(await service.getTask("bad")).toEqual({ code: "NOT_FOUND", ok: false }); expect(await service.createTask({ ...input, title: "" })).toMatchObject({ code: "VALIDATION", ok: false }); expect(repository.create).not.toHaveBeenCalled(); });
});
