import "server-only";

import {
  requireBackendUser,
  AuthorizationError,
  type AccessContext,
} from "@/lib/auth/authorization";
import { getEvent } from "@/features/events/core/service";
import type { EventReadResult } from "@/features/events/core/contracts";
import {
  EventPreparationRepositoryError,
  createEventPreparationRepository,
  type EventPreparationRepository,
} from "./repository";
import { calculateEventPreparationProgress } from "./progress";
import type { EventPreparationResult, TaskEventLinkResult } from "./contracts";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Dependencies = Readonly<{
  authorise(): Promise<AccessContext>;
  getEvent(id: string): Promise<EventReadResult>;
  repository: EventPreparationRepository;
}>;

function errorCode(error: unknown) {
  return error instanceof AuthorizationError ||
    (error instanceof EventPreparationRepositoryError &&
      ["42501", "PGRST301"].includes(error.code ?? ""))
    ? ("PERMISSION_DENIED" as const)
    : ("SYSTEM_ERROR" as const);
}

export function createEventPreparationService(dependencies: Dependencies) {
  return {
    async getPreparation(eventId: string): Promise<EventPreparationResult> {
      try {
        await dependencies.authorise();
        if (!UUID.test(eventId)) return { code: "NOT_FOUND", ok: false };
        const event = await dependencies.getEvent(eventId);
        if (!event.ok)
          return event.code === "NOT_FOUND"
            ? event
            : { code: event.code, ok: false };
        const tasks = await dependencies.repository.listByEvent(eventId);
        return {
          ok: true,
          snapshot: {
            eventId,
            progress: calculateEventPreparationProgress(tasks),
            tasks,
          },
        };
      } catch (error) {
        return { code: errorCode(error), ok: false };
      }
    },
    async setTaskEvent(
      taskId: string,
      eventId: string | null,
    ): Promise<TaskEventLinkResult> {
      try {
        await dependencies.authorise();
        if (!UUID.test(taskId) || (eventId !== null && !UUID.test(eventId)))
          return { code: "VALIDATION", ok: false };
        if (eventId !== null) {
          const event = await dependencies.getEvent(eventId);
          if (!event.ok)
            return {
              code: event.code === "NOT_FOUND" ? "NOT_FOUND" : event.code,
              ok: false,
            };
        }
        const updated = await dependencies.repository.setEvent(taskId, eventId);
        return updated
          ? { ok: true, task: updated }
          : { code: "NOT_FOUND", ok: false };
      } catch (error) {
        return { code: errorCode(error), ok: false };
      }
    },
  };
}

const service = createEventPreparationService({
  authorise: requireBackendUser,
  getEvent,
  repository: createEventPreparationRepository(),
});
export const getEventPreparation = service.getPreparation;
export const setTaskEvent = service.setTaskEvent;
