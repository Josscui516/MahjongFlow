import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthorizationError, requireBackendUser, type AccessContext } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import { isRegistrationId } from "../records/validation";
import type { ParticipationSummaryResult } from "./contracts";

export function createParticipationSummaryService({ authorise, getClient }: Readonly<{
  authorise: () => Promise<AccessContext>;
  getClient: () => Promise<SupabaseClient<Database>>;
}>) {
  return { async get(eventId: string): Promise<ParticipationSummaryResult> {
    try {
      const access = await authorise();
      if (!["committee", "authorised"].includes(access.role)) return { ok: false, code: "PERMISSION_DENIED" };
      if (!isRegistrationId(eventId)) return { ok: false, code: "VALIDATION" };
      // Both numbers must come from the same database snapshot. No row-level reads.
      const { data, error } = await (await getClient()).rpc("get_event_participation_totals", { event_ids: [eventId] });
      if (error) return { ok: false, code: ["42501", "PGRST301"].includes(error.code) ? "PERMISSION_DENIED" : "SYSTEM_ERROR" };
      const row = data?.find(item => item.event_id.toLowerCase() === eventId.toLowerCase());
      if (!row) return { ok: false, code: "UNAVAILABLE" };
      if (![row.registration_count, row.attendance_count].every(count => Number.isSafeInteger(count) && count >= 0)) return { ok: false, code: "SYSTEM_ERROR" };
      return { ok: true, registrationCount: row.registration_count, confirmedAttendanceCount: row.attendance_count };
    } catch (error) {
      return { ok: false, code: error instanceof AuthorizationError ? error.code === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "PERMISSION_DENIED" : "SYSTEM_ERROR" };
    }
  } };
}
export const participationSummaryService = createParticipationSummaryService({ authorise: requireBackendUser, getClient: createServerSupabaseClient });
