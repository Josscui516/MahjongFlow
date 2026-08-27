import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type {
  TaskInput,
  TaskRecordDTO,
  TaskStatus,
} from "@/features/tasks/core/contracts";
import type { TaskRepository } from "@/features/tasks/core/repository";
import { createTaskService } from "@/features/tasks/core/service";
import { AuthorizationError } from "@/lib/auth/authorization";
import { DECISION_TO_TASK_FIXTURE } from "../../fixtures/decision-to-task/fictional-workflow";

function createMemoryRepository() {
  const records = new Map<string, TaskRecordDTO>();
  let sequence = 0;

  const repository: TaskRepository = {
    async create(actorId, input) {
      sequence += 1;
      const record: TaskRecordDTO = {
        ...input,
        createdAt: "2026-08-27T00:00:00.000Z",
        createdBy: actorId,
        id: `47000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
        updatedAt: "2026-08-27T00:00:00.000Z",
      };
      records.set(record.id, record);
      return record;
    },
    async delete(taskId) {
      return records.delete(taskId) ? "deleted" : "not_found";
    },
    async get(taskId) {
      return records.get(taskId) ?? null;
    },
    async list() {
      return [...records.values()];
    },
    async update(taskId, input) {
      const current = records.get(taskId);
      if (!current) return null;
      const updated = { ...current, ...input, updatedAt: "2026-08-27T01:00:00.000Z" };
      records.set(taskId, updated);
      return updated;
    },
  };

  return { records, repository };
}

function taskInput(status: TaskStatus = "not_started"): TaskInput {
  return { ...DECISION_TO_TASK_FIXTURE.task, status };
}

describe("Sprint 4 task regression acceptance", () => {
  it("covers T-01 create, read, update, and refresh-stable data", async () => {
    const memory = createMemoryRepository();
    const service = createTaskService({
      authorise: async () => DECISION_TO_TASK_FIXTURE.actor,
      repository: memory.repository,
    });

    const created = await service.createTask(taskInput());
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await service.updateTask(created.record.id, {
      ...taskInput("in_progress"),
      title: "Confirm revised fictional venue",
    });
    const refreshed = await service.getTask(created.record.id);

    expect(updated).toMatchObject({ ok: true });
    expect(refreshed).toEqual(updated.ok ? { ok: true, record: updated.record } : updated);
  });

  it("covers T-02 allowed states and rejects an unknown persisted state", async () => {
    const memory = createMemoryRepository();
    const service = createTaskService({
      authorise: async () => DECISION_TO_TASK_FIXTURE.actor,
      repository: memory.repository,
    });

    for (const status of ["not_started", "in_progress", "completed"] as const) {
      const result = await service.createTask(taskInput(status));
      expect(result).toMatchObject({ ok: true, record: { status } });
    }

    const invalid = await service.createTask({
      ...taskInput(),
      status: "overdue" as TaskStatus,
    });
    expect(invalid).toMatchObject({ code: "VALIDATION", ok: false });
    expect(memory.records.size).toBe(3);
  });

  it("covers T-08 denial before task reads or writes", async () => {
    const memory = createMemoryRepository();
    const repository = {
      create: vi.fn(memory.repository.create),
      delete: vi.fn(memory.repository.delete),
      get: vi.fn(memory.repository.get),
      list: vi.fn(memory.repository.list),
      update: vi.fn(memory.repository.update),
    } satisfies TaskRepository;
    const service = createTaskService({
      authorise: async () => {
        throw new AuthorizationError("UNAUTHENTICATED");
      },
      repository,
    });

    await expect(service.listTasks()).resolves.toEqual({
      code: "PERMISSION_DENIED",
      ok: false,
    });
    await expect(service.createTask(taskInput())).resolves.toEqual({
      code: "PERMISSION_DENIED",
      ok: false,
    });
    expect(repository.list).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });
});
