import "server-only";
import { AuthorizationError, requireAuthorised } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DinnerFailure } from "./contracts";

export type DinnerRosterRecord = Readonly<{
  eventId: string; participantId: string; participantName: string;
  participantEmail: string; status: "listed" | "removed";
}>;
export type DinnerRosterResult = DinnerFailure | Readonly<{
  ok: true; event: Readonly<{ id: string; name: string }>; items: readonly DinnerRosterRecord[];
}>;
export type DinnerRosterReadPort = Readonly<{ listForEvent: (eventId: string) => Promise<DinnerRosterResult> }>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function rosterFailure(error: unknown): DinnerFailure {
  if (error instanceof AuthorizationError) return { ok: false,
    code: error.code === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "PERMISSION_DENIED" };
  return { ok: false, code: "SYSTEM_ERROR" };
}

export const dinnerRosterService: DinnerRosterReadPort = {
  async listForEvent(eventId) {
    try {
      await requireAuthorised();
      if (!UUID.test(eventId)) return { ok: false, code: "VALIDATION" };
      const client = await createServerSupabaseClient();
      const event = await client.from("events").select("id,name").eq("id", eventId).maybeSingle();
      if (event.error) return { ok: false, code: "SYSTEM_ERROR" };
      if (!event.data) return { ok: false, code: "UNAVAILABLE" };
      const items: DinnerRosterRecord[] = [];
      for (let offset = 0; ; offset += 250) {
        const result = await client.from("dinner_roster").select("id,event_id,full_name,email,is_active")
          .eq("event_id", eventId).order("id").range(offset, offset + 249);
        if (result.error) return { ok: false, code: "SYSTEM_ERROR" };
        items.push(...result.data.map((row): DinnerRosterRecord => ({
          eventId: row.event_id, participantId: row.id, participantName: row.full_name,
          participantEmail: row.email, status: row.is_active ? "listed" : "removed",
        })));
        if (result.data.length < 250) break;
      }
      return { ok: true, event: event.data, items };
    } catch (error) { return rosterFailure(error); }
  },
};

export async function saveDinnerRosterEntry(eventId: string, fullName: string, email: string) {
  try {
    const access = await requireAuthorised();
    if (!access.canManageAccounts) return { ok: false, code: "PERMISSION_DENIED" } as const;
    const name = fullName.trim();
    const normalized = email.trim().toLowerCase();
    if (!UUID.test(eventId) || !name || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)
      || normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { ok: false, code: "VALIDATION" } as const;
    }
    const client = await createServerSupabaseClient();
    const existing = await client.from("dinner_roster").select("id").eq("event_id", eventId).eq("email", normalized).maybeSingle();
    if (existing.error) return { ok: false, code: "SYSTEM_ERROR" } as const;
    const result = existing.data
      ? await client.from("dinner_roster").update({ full_name: name, is_active: true }).eq("id", existing.data.id).select("id").single()
      : await client.from("dinner_roster").insert({ event_id: eventId, full_name: name, email: normalized }).select("id").single();
    if (result.error) return { ok: false, code: result.error.code === "23505" ? "VALIDATION" : "SYSTEM_ERROR" } as const;
    return { ok: true } as const;
  } catch (error) { return rosterFailure(error); }
}

export async function removeDinnerRosterEntry(eventId: string, entryId: string) {
  try {
    const access = await requireAuthorised();
    if (!access.canManageAccounts) return { ok: false, code: "PERMISSION_DENIED" } as const;
    if (!UUID.test(eventId) || !UUID.test(entryId)) return { ok: false, code: "VALIDATION" } as const;
    const client = await createServerSupabaseClient();
    const result = await client.from("dinner_roster").update({ is_active: false })
      .eq("event_id", eventId).eq("id", entryId).select("id").maybeSingle();
    if (result.error) return { ok: false, code: "SYSTEM_ERROR" } as const;
    return result.data ? { ok: true } as const : { ok: false, code: "UNAVAILABLE" } as const;
  } catch (error) { return rosterFailure(error); }
}
