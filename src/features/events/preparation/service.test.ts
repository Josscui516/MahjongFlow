import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { AuthorizationError } from "@/lib/auth/authorization";
import type { EventDTO } from "@/features/events/core/contracts";
import type { TaskRecordDTO } from "@/features/tasks/core/contracts";
import { createEventPreparationService } from "./service";

const eventId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
const sourceMeetingId = "33333333-3333-4333-8333-333333333333";
const event: EventDTO = {
  createdAt: "2026-09-01T00:00:00Z",
  createdBy: taskId,
  description: "Fictional event",
  eventType: "weekly_session",
  id: eventId,
  location: "Fictional Hall",
  name: "Fictional weekly event",
  requiresStudentId: false,
  startsAt: "2026-09-20T01:00:00Z",
  status: "scheduled",
  updatedAt: "2026-09-01T00:00:00Z",
};
const task: TaskRecordDTO = {
  assigneeId: taskId,
  createdAt: "2026-09-01T00:00:00Z",
  createdBy: taskId,
  description: "Fictional preparation",
  dueDate: "2026-09-19",
  eventId: null,
  id: taskId,
  sourceDecisionId: null,
  sourceDiscussionPointId: null,
  sourceMeetingId,
  status: "in_progress",
  title: "Prepare fictional venue",
  updatedAt: "2026-09-01T00:00:00Z",
};
const access = async () => ({
  canManageAccounts: false,
  role: "committee" as const,
  userId: taskId,
});

function dependencies() {
  return {
    authorise: vi.fn(access),
    getEvent: vi.fn(async () => ({ ok: true as const, record: event })),
    repository: {
      listByEvent: vi.fn(async () => [
        { ...task, eventId, status: "completed" as const },
        { ...task, eventId, id: sourceMeetingId },
      ]),
      setEvent: vi.fn(async (_id: string, linkedEventId: string | null) => ({
        ...task,
        eventId: linkedEventId,
      })),
    },
  };
}

describe("event preparation service", () => {
  it("returns linked tasks and instantaneous progress", async () => {
    const deps = dependencies();
    const result = await createEventPreparationService(
      deps as never,
    ).getPreparation(eventId);
    expect(result).toMatchObject({
      ok: true,
      snapshot: { eventId, progress: { completed: 1, total: 2 } },
    });
    expect(deps.repository.listByEvent).toHaveBeenCalledWith(eventId);
  });

  it("links and unlinks with a narrow update that preserves concurrent task changes", async () => {
    const deps = dependencies();
    deps.repository.setEvent.mockResolvedValueOnce({
      ...task,
      assigneeId: sourceMeetingId,
      eventId,
      status: "completed",
      title: "Concurrent title",
    });
    const service = createEventPreparationService(deps as never);
    await expect(service.setTaskEvent(taskId, eventId)).resolves.toMatchObject({
      ok: true,
      task: {
        assigneeId: sourceMeetingId,
        eventId,
        status: "completed",
        title: "Concurrent title",
      },
    });
    expect(deps.repository.setEvent).toHaveBeenLastCalledWith(taskId, eventId);
    await service.setTaskEvent(taskId, null);
    expect(deps.repository.setEvent).toHaveBeenLastCalledWith(taskId, null);
  });

  it("rejects malformed ids and missing events before task mutation", async () => {
    const deps = dependencies();
    const service = createEventPreparationService(deps as never);
    await expect(service.setTaskEvent("bad", eventId)).resolves.toEqual({
      code: "VALIDATION",
      ok: false,
    });
    deps.getEvent.mockResolvedValueOnce({
      code: "NOT_FOUND",
      ok: false,
    } as never);
    await expect(service.setTaskEvent(taskId, eventId)).resolves.toEqual({
      code: "NOT_FOUND",
      ok: false,
    });
    expect(deps.repository.setEvent).not.toHaveBeenCalled();
  });

  it("denies anonymous access before reading or mutating persistence", async () => {
    const deps = dependencies();
    deps.authorise.mockRejectedValue(new AuthorizationError("UNAUTHENTICATED"));
    const service = createEventPreparationService(deps as never);
    await expect(service.getPreparation(eventId)).resolves.toEqual({
      code: "PERMISSION_DENIED",
      ok: false,
    });
    await expect(service.setTaskEvent(taskId, eventId)).resolves.toEqual({
      code: "PERMISSION_DENIED",
      ok: false,
    });
    expect(deps.repository.listByEvent).not.toHaveBeenCalled();
    expect(deps.repository.setEvent).not.toHaveBeenCalled();
  });
});
