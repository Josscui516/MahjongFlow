import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import type { ManualAttendanceCommand } from "./contracts";

export type ManualAttendanceWriteResult =
  | Readonly<{ outcome: "updated"; eventId: string; updatedAt: string }>
  | Readonly<{ outcome: "conflict" | "unavailable" | "participant-missing" }>;

export type ManualAttendanceRepository = Readonly<{
  execute: (command: ManualAttendanceCommand) => Promise<ManualAttendanceWriteResult>;
}>;

export class ManualAttendanceRepositoryError extends Error {
  constructor(readonly code?: string) {
    super("Manual attendance persistence failed");
    this.name = "ManualAttendanceRepositoryError";
  }
}

function fail(error?: Readonly<{ code?: string }>): never {
  throw new ManualAttendanceRepositoryError(error?.code);
}

export function createManualAttendanceRepository(
  getClient: () => Promise<SupabaseClient<Database>> = createServerSupabaseClient,
): ManualAttendanceRepository {
  return {
    async execute(command) {
      // This is the cookie/JWT-scoped client, never a service-role client.
      const client = await getClient();
      const event = await client.from("events").select("id").eq("id", command.eventId).maybeSingle();
      if (event.error) fail(event.error);
      if (!event.data) return { outcome: "unavailable" };

      const fields = "event_id, updated_at";
      let result;
      if (command.operation === "create") {
        // Existing participant facts only; never create a participant/registration.
        const participant = await client.from("participants").select("id")
          .eq("email", command.email).maybeSingle();
        if (participant.error) fail(participant.error);
        if (!participant.data) return { outcome: "participant-missing" };
        const payload = { event_id: command.eventId, participant_id: participant.data.id };
        // The generated Insert type cannot express BEFORE INSERT trigger defaults.
        // check_in_method is required in the schema but is not an insertable column
        // for authenticated users; the trusted trigger supplies it instead.
        result = await client.from("attendance_records")
          .insert(payload as Database["public"]["Tables"]["attendance_records"]["Insert"])
          .select(fields).single();
      } else {
        // One conditional UPDATE: the row lock and exact version predicate avoid
        // lost updates, including a concurrent void -> restore (ABA) cycle.
        result = await client.from("attendance_records")
          .update({ attendance_status: command.targetStatus })
          .eq("event_id", command.eventId).eq("id", command.recordId)
          .eq("updated_at", command.expectedUpdatedAt)
          .eq("attendance_status", command.targetStatus === "confirmed" ? "voided" : "confirmed")
          .select(fields).maybeSingle();
      }
      if (result.error) fail(result.error);
      if (!result.data) {
        if (command.operation === "correct") return { outcome: "conflict" };
        fail();
      }
      if (result.data.event_id !== command.eventId || !result.data.updated_at || !Number.isFinite(Date.parse(result.data.updated_at))) {
        fail({ code: "INVALID_DATA" });
      }
      // Actor, method and both timestamps come exclusively from DB defaults and
      // trusted triggers; no untrusted provenance is included in either payload.
      return { outcome: "updated", eventId: result.data.event_id, updatedAt: result.data.updated_at };
    },
  };
}
