import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import type { UpcomingEventDTO } from "./contracts";

type EventRow = Pick<Database["public"]["Tables"]["events"]["Row"], "id" | "location" | "name" | "starts_at">;
const PUBLIC_COLUMNS = "id, name, starts_at, location";

export class UpcomingEventRepositoryError extends Error {
  constructor(readonly code?: string) { super("Upcoming event query failed"); this.name = "UpcomingEventRepositoryError"; }
}
export type UpcomingEventRepository = Readonly<{ listFrom(startsAt: string): Promise<readonly UpcomingEventDTO[]> }>;

export function createUpcomingEventRepository(getClient: () => Promise<SupabaseClient<Database>> = createServerSupabaseClient): UpcomingEventRepository {
  return { async listFrom(startsAt) { const result = await (await getClient()).from("events").select(PUBLIC_COLUMNS).gte("starts_at", startsAt).order("starts_at").order("id"); if (result.error) throw new UpcomingEventRepositoryError(result.error.code); return (result.data ?? []).map((row) => { const event = row as EventRow; return { id: event.id, location: event.location, name: event.name, startsAt: event.starts_at }; }); } };
}
