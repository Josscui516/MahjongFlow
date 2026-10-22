import "server-only";

import { requireAuthorised } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import { rosterFailure, type DinnerRosterReadPort, type DinnerRosterRecord } from "./roster";

/** Current eligible attendees, not the administrator's complete internal roster. */
export const matchedDinnerAttendance: DinnerRosterReadPort = {
  async listForEvent(eventId) {
    try {
      await requireAuthorised();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
        return { ok: false, code: "VALIDATION" };
      }
      const client = await createServerSupabaseClient();
      const event = await client.from("events").select("id,name").eq("id", eventId).maybeSingle();
      if (event.error) return { ok: false, code: "SYSTEM_ERROR" };
      if (!event.data) return { ok: false, code: "UNAVAILABLE" };
      const items: DinnerRosterRecord[] = [];
      for (let offset = 0; ; offset += 250) {
        const result = await client.rpc("list_event_dinner_service", { target_event_id: eventId })
          .order("participant_id").range(offset, offset + 249);
        if (result.error) return { ok: false, code: "SYSTEM_ERROR" };
        items.push(...result.data.map((row: Database["public"]["Functions"]["list_event_dinner_service"]["Returns"][number]): DinnerRosterRecord => ({
          eventId: row.event_id, participantId: row.participant_id,
          participantName: row.full_name, participantEmail: row.email, status: row.eligible ? "listed" : "removed", issuedAt: row.issued_at,
        })));
        if (result.data.length < 250) break;
      }
      return { ok: true, event: event.data, items };
    } catch (error) { return rosterFailure(error); }
  },
};
