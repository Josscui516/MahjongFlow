import "server-only";
import { requireBackendUser } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { rosterFailure } from "./roster";

export async function recordDinnerIssued(eventId: string, participantId: string, issued: boolean, expectedIssued: boolean) {
  try {
    await requireBackendUser();
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuid.test(eventId) || !uuid.test(participantId) || typeof issued !== "boolean" || typeof expectedIssued !== "boolean") {
      return { ok: false, code: "VALIDATION" } as const;
    }
    const client = await createServerSupabaseClient();
    const result = await client.rpc("set_event_dinner_issued", {
      target_event_id: eventId, target_participant_id: participantId, desired_issued: issued, expected_issued: expectedIssued,
    });
    if (result.error) return { ok: false, code: result.error.code === "42501" ? "PERMISSION_DENIED"
      : result.error.code === "PDI01" || result.error.code === "40001" ? "REFRESH_REQUIRED" : "SYSTEM_ERROR" } as const;
    return { ok: true } as const;
  } catch (error) { return rosterFailure(error); }
}
