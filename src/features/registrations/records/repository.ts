import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import { REGISTRATION_PAGE_SIZE, type RegistrationCreateInput, type RegistrationItem, type RegistrationStatus, type RegistrationUpdateInput } from "./contracts";

type StoredRegistration = Readonly<{ id: string; registration_status: RegistrationStatus; updated_at: string }>;
export type RegistrationRepository = Readonly<{
  create: (input: RegistrationCreateInput) => Promise<Readonly<{ created: boolean; status: RegistrationStatus }>>;
  update: (input: RegistrationUpdateInput) => Promise<"updated" | "unchanged" | "conflict" | "unavailable">;
  list: (eventId: string, page: number) => Promise<Readonly<{ items: readonly RegistrationItem[]; total: number }> | null>;
  count: (eventId: string) => Promise<number | null>;
}>;
export class RegistrationRepositoryError extends Error {
  constructor(readonly code?: string) { super("Registration persistence failed"); }
}
function fail(error: { code?: string }): never { throw new RegistrationRepositoryError(error.code); }
const fields = "id, registration_status, updated_at";

export function createRegistrationRepository(
  getClient: () => Promise<SupabaseClient<Database>> = createServerSupabaseClient,
): RegistrationRepository {
  async function find(client: SupabaseClient<Database>, eventId: string, registrationId: string): Promise<StoredRegistration | null> {
    const { data, error } = await client.from("registrations").select(fields).eq("event_id", eventId).eq("id", registrationId).maybeSingle();
    if (error) fail(error);
    return data;
  }
  return {
    async create(input) {
      const client = await getClient();
      // INSERT only: a repeated registration must never restore a cancelled row.
      // Status, timestamps and recorder are set by existing database defaults/triggers.
      // Generated Insert marks recorded_by required, but this column is deliberately
      // not granted for insertion: the trusted trigger supplies it from auth.uid().
      const payload = { event_id: input.eventId, participant_id: input.participantId };
      const { data, error } = await client.from("registrations")
        .insert(payload as Database["public"]["Tables"]["registrations"]["Insert"])
        .select(fields).single();
      if (!error && data) return { created: true, status: data.registration_status };
      if (error?.code !== "23505") fail(error ?? {});
      const existing = await client.from("registrations").select(fields)
        .eq("event_id", input.eventId).eq("participant_id", input.participantId).maybeSingle();
      if (existing.error || !existing.data) fail(existing.error ?? {});
      return { created: false, status: existing.data.registration_status };
    },
    async update(input) {
      const client = await getClient();
      const current = await find(client, input.eventId, input.registrationId);
      if (!current) return "unavailable";
      if (current.registration_status === input.status) return "unchanged";
      // Compare the exact database version: stale forms cannot overwrite a later edit.
      const result = await client.from("registrations").update({ registration_status: input.status })
        .eq("event_id", input.eventId).eq("id", input.registrationId)
        .eq("updated_at", input.expectedUpdatedAt).select(fields).maybeSingle();
      if (result.error) fail(result.error);
      if (result.data) return "updated";
      const latest = await find(client, input.eventId, input.registrationId);
      if (!latest) return "unavailable";
      return latest.registration_status === input.status ? "unchanged" : "conflict";
    },
    async list(eventId, page) {
      const client = await getClient();
      const event = await client.from("events").select("id").eq("id", eventId).maybeSingle();
      if (event.error) fail(event.error);
      if (!event.data) return null;
      const offset = (page - 1) * REGISTRATION_PAGE_SIZE;
      const result = await client.from("registrations")
        .select("id, registration_status, updated_at, participants!inner(full_name, email)", { count: "exact" })
        .eq("event_id", eventId).order("registered_at", { ascending: false }).order("id")
        .range(offset, offset + REGISTRATION_PAGE_SIZE - 1);
      if (result.error || result.count === null) fail(result.error ?? {});
      return {
        total: result.count,
        items: (result.data ?? []).map((row) => ({
          id: row.id, status: row.registration_status, updatedAt: row.updated_at,
          participantName: row.participants.full_name, participantEmail: row.participants.email,
        })),
      };
    },
    async count(eventId) {
      const { data, error } = await (await getClient()).rpc("get_event_participation_totals", { event_ids: [eventId] });
      if (error) fail(error);
      const row = data?.find((item) => item.event_id.toLowerCase() === eventId.toLowerCase());
      if (!row) return null;
      if (!Number.isSafeInteger(row.registration_count) || row.registration_count < 0) fail({});
      return row.registration_count;
    },
  };
}
