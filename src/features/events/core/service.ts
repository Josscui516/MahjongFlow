import "server-only";
import { AuthorizationError, requireBackendUser, type AccessContext } from "@/lib/auth/authorization";
import type { EventInput, EventListResult, EventMutationResult, EventReadResult } from "./contracts";
import { createEventRepository, EventRepositoryError, type EventRepository } from "./repository";
import { isEventId, validateEventInput } from "./validation";
type Dependencies = Readonly<{ authorise: () => Promise<AccessContext>; repository: EventRepository }>;
const errorCode = (error: unknown) => error instanceof AuthorizationError || (error instanceof EventRepositoryError && ["42501", "PGRST301"].includes(error.code ?? "")) ? "PERMISSION_DENIED" as const : "SYSTEM_ERROR" as const;
export function createEventService({ authorise, repository }: Dependencies) { return {
  async createEvent(input: EventInput): Promise<EventMutationResult> { try { const actor = await authorise(); const checked = validateEventInput(input); return checked.ok ? { ok: true, record: await repository.create(actor.userId, checked.value) } : { code: "VALIDATION", errors: checked.errors, ok: false }; } catch (error) { return { code: errorCode(error), ok: false }; } },
  async getEvent(id: string): Promise<EventReadResult> { try { await authorise(); if (!isEventId(id)) return { code: "NOT_FOUND", ok: false }; const record = await repository.get(id); return record ? { ok: true, record } : { code: "NOT_FOUND", ok: false }; } catch (error) { return { code: errorCode(error), ok: false }; } },
  async listEvents(): Promise<EventListResult> { try { await authorise(); return { items: await repository.list(), ok: true }; } catch (error) { return { code: errorCode(error), ok: false }; } },
  async updateEvent(id: string, input: EventInput): Promise<EventMutationResult> { try { await authorise(); if (!isEventId(id)) return { code: "NOT_FOUND", ok: false }; const checked = validateEventInput(input); if (!checked.ok) return { code: "VALIDATION", errors: checked.errors, ok: false }; const record = await repository.update(id, checked.value); return record ? { ok: true, record } : { code: "NOT_FOUND", ok: false }; } catch (error) { return { code: errorCode(error), ok: false }; } },
}; }
const service = createEventService({ authorise: requireBackendUser, repository: createEventRepository() });
export const createEvent = service.createEvent; export const getEvent = service.getEvent; export const listEvents = service.listEvents; export const updateEvent = service.updateEvent;
