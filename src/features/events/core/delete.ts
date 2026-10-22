import "server-only";
import { AuthorizationError, requireBackendUser } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isEventId } from "./validation";

export type EventDeleteResult = { ok: true } | { ok: false; code: "NOT_FOUND" | "LINKED_RECORDS" | "PERMISSION_DENIED" | "SYSTEM_ERROR" };
export function createEventDeleter({ authorise = requireBackendUser, getClient = createServerSupabaseClient } = {}) {
  return async (id: string): Promise<EventDeleteResult> => {
    try {
      await authorise();
      if (!isEventId(id)) return { ok: false, code: "NOT_FOUND" };
      const { data, error } = await (await getClient()).rpc("delete_event_record", { target_event_id: id });
      if (error) return { ok: false, code: error.code === "42501" ? "PERMISSION_DENIED" : "SYSTEM_ERROR" };
      if (data === "deleted") return { ok: true };
      return { ok: false, code: data === "linked_records" ? "LINKED_RECORDS" : data === "not_found" ? "NOT_FOUND" : "SYSTEM_ERROR" };
    } catch (error) {
      return { ok: false, code: error instanceof AuthorizationError ? "PERMISSION_DENIED" : "SYSTEM_ERROR" };
    }
  };
}
export const deleteEvent = createEventDeleter();
