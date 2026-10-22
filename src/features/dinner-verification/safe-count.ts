import "server-only";
import { requireBackendUser } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function readDinnerEligibilityCount(eventId: string): Promise<number | null> {
  try {
    await requireBackendUser();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) return null;
    const client = await createServerSupabaseClient();
    const { data, error } = await client.rpc("get_event_dinner_eligibility_total", { target_event_id: eventId });
    return !error && typeof data === "number" && Number.isSafeInteger(data) && data >= 0 ? data : null;
  } catch { return null; }
}
