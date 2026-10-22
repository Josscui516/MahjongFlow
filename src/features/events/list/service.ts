import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthorizationError, requireBackendUser } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import { literalPattern } from "@/lib/search/literal-pattern";
import type { EventSummary } from "../core/contracts";
import { EVENT_PAGE_SIZE, eventDateBounds, readEventFilters, type EventSearchParams } from "./filters";

export type EventBrowseResult = { ok: true; items: readonly EventSummary[]; total: number } | { ok: false; code: "VALIDATION" | "PERMISSION_DENIED" | "SYSTEM_ERROR"; message?: string };
export function createEventBrowser({ authorise = requireBackendUser, getClient = createServerSupabaseClient }: { authorise?: () => Promise<unknown>; getClient?: () => Promise<SupabaseClient<Database>> } = {}) {
  return async (params: EventSearchParams): Promise<EventBrowseResult> => {
    try {
      await authorise();
      const { filters, error } = readEventFilters(params);
      if (error) return { ok: false, code: "VALIDATION", message: error };
      let query = (await getClient()).from("events").select("id,event_type,name,starts_at,location,status", { count: "exact" });
      if (filters.q) query = query.filter("name", "imatch", literalPattern(filters.q));
      if (filters.status) query = query.eq("status", filters.status);
      const bounds = eventDateBounds(filters);
      if (bounds.from) query = query.gte("starts_at", bounds.from);
      if (bounds.before) query = query.lt("starts_at", bounds.before);
      const offset = (filters.page - 1) * EVENT_PAGE_SIZE;
      const result = await query.order(filters.sort === "name" ? "name" : "starts_at", { ascending: filters.sort !== "latest" }).order("id").range(offset, offset + EVENT_PAGE_SIZE - 1);
      if (result.error || result.count === null) return { ok: false, code: result.error?.code === "42501" ? "PERMISSION_DENIED" : "SYSTEM_ERROR" };
      return { ok: true, total: result.count, items: (result.data ?? []).map(row => ({ id: row.id, name: row.name, startsAt: row.starts_at, eventType: row.event_type, location: row.location, status: row.status })) };
    } catch (error) { return { ok: false, code: error instanceof AuthorizationError ? "PERMISSION_DENIED" : "SYSTEM_ERROR" }; }
  };
}
export const browseEvents = createEventBrowser();
