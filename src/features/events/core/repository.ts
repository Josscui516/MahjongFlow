import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import type { EventDTO, EventInput, EventSummary } from "./contracts";
type EventRow = Database["public"]["Tables"]["events"]["Row"];
export class EventRepositoryError extends Error { constructor(readonly code?: string) { super("Event persistence failed"); this.name = "EventRepositoryError"; } }
export type EventRepository = Readonly<{ create: (actorId: string, input: EventInput) => Promise<EventDTO>; get: (id: string) => Promise<EventDTO | null>; list: () => Promise<readonly EventSummary[]>; update: (id: string, input: EventInput) => Promise<EventDTO | null> }>;
const select = "id, event_type, name, starts_at, location, description, status, requires_student_id, created_by, created_at, updated_at";
const fail = (error: { code?: string }): never => { throw new EventRepositoryError(error.code); };
const map = (row: EventRow): EventDTO => ({ createdAt: row.created_at, createdBy: row.created_by, description: row.description, eventType: row.event_type, id: row.id, location: row.location, name: row.name, requiresStudentId: row.requires_student_id, startsAt: row.starts_at, status: row.status, updatedAt: row.updated_at });
const payload = (input: EventInput) => ({ description: input.description, event_type: input.eventType, location: input.location, name: input.name, requires_student_id: input.requiresStudentId, starts_at: input.startsAt, status: input.status });
export function createEventRepository(getClient: () => Promise<SupabaseClient<Database>> = createServerSupabaseClient): EventRepository { return {
  async create(actorId, input) { const result = await (await getClient()).from("events").insert({ ...payload(input), created_by: actorId }).select(select).single(); if (result.error) fail(result.error); return map(result.data as EventRow); },
  async get(id) { const result = await (await getClient()).from("events").select(select).eq("id", id).maybeSingle(); if (result.error) fail(result.error); return result.data ? map(result.data as EventRow) : null; },
  async list() { const result = await (await getClient()).from("events").select(select).order("starts_at").order("id"); if (result.error) fail(result.error); return (result.data ?? []).map((row) => { const item = map(row as EventRow); return { eventType: item.eventType, id: item.id, location: item.location, name: item.name, startsAt: item.startsAt, status: item.status }; }); },
  async update(id, input) { const result = await (await getClient()).from("events").update(payload(input)).eq("id", id).select(select).maybeSingle(); if (result.error) fail(result.error); return result.data ? map(result.data as EventRow) : null; },
}; }
