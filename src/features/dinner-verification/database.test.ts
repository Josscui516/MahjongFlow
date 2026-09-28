import { randomUUID, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Database } from "@/types/database.generated";

vi.mock("server-only", () => ({}));
const session = vi.hoisted(() => ({ client: null as SupabaseClient<Database> | null }));
// Only the Next cookie/session transport is substituted. The production public
// provider, authorisation, HTTP, PostgREST joins and database RLS remain real.
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => {
    if (!session.client) throw new Error("Missing fixture session");
    return session.client;
  },
}));

import { readDinnerEligibility } from "./server";

describe.skipIf(process.env.ISSUE35_LIVE_DATABASE !== "1")("#35 real public attendance provider", () => {
  let admin: SupabaseClient<Database>;
  let authorised: SupabaseClient<Database>;
  let committee: SupabaseClient<Database>;
  let outsider: SupabaseClient<Database>;
  let anonymous: SupabaseClient<Database>;
  const users: string[] = [];
  const eventId = randomUUID();
  const otherEventId = randomUUID();
  const participantId = randomUUID();
  const absentParticipantId = randomUUID();

  function check(error: unknown) {
    if (error) throw new Error("Fictional local database operation failed");
  }

  beforeAll(async () => {
    const url = process.env.ISSUE35_LOCAL_URL!;
    if (new URL(url).origin !== "http://127.0.0.1:45321") throw new Error("Local fixture database required");
    const options = { auth: { persistSession: false, autoRefreshToken: false } };
    admin = createClient<Database>(url, process.env.ISSUE35_LOCAL_FIXTURE_KEY!, options);
    const client = () => createClient<Database>(url, process.env.ISSUE35_LOCAL_PUBLIC_KEY!, options);
    [authorised, committee, outsider, anonymous] = [client(), client(), client(), client()];
    for (const [db, role] of [[authorised, "authorised"], [committee, "committee"], [outsider, null]] as const) {
      const email = `issue35-${randomUUID()}@example.test`;
      const password = randomBytes(24).toString("hex");
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      check(created.error);
      if (!created.data.user) throw new Error("Missing fictional user");
      const id = created.data.user.id;
      users.push(id);
      if (role) check((await admin.from("profiles").insert({ id, display_name: "Fictional Dinner Tester", committee_role: role })).error);
      check((await db.auth.signInWithPassword({ email, password })).error);
    }
    check((await admin.from("events").insert([eventId, otherEventId].map((id) => ({
      id, name: "Fictional Issue 35 Event", description: "Disposable local verification",
      event_type: "weekly_session" as const, starts_at: "2026-09-28T08:00:00Z",
      location: "Fictional Room", created_by: users[0],
    })))).error);
    check((await admin.from("participants").insert([participantId, absentParticipantId].map((id) => ({
      id, full_name: "Fictional Dinner Attendee", email: `issue35-${id}@example.test`,
    })))).error);
    check((await admin.from("registrations").insert([participantId, absentParticipantId].map((id) => ({
      event_id: eventId, participant_id: id, recorded_by: users[0],
    })))).error);
    check((await admin.from("attendance_records").insert({
      event_id: eventId, participant_id: participantId, check_in_method: "qr", recorded_by: null,
    })).error);
    session.client = authorised;
  }, 60000);

  afterAll(async () => {
    session.client = null;
    if (!admin) return;
    // Delete only UUID-scoped records created by this test, never reset the DB.
    check((await admin.from("attendance_records").delete().in("event_id", [eventId, otherEventId])).error);
    check((await admin.from("registrations").delete().in("event_id", [eventId, otherEventId])).error);
    check((await admin.from("events").delete().in("id", [eventId, otherEventId])).error);
    check((await admin.from("participants").delete().in("id", [participantId, absentParticipantId])).error);
    if (users.length) check((await admin.from("profiles").delete().in("id", users)).error);
    for (const id of users) check((await admin.auth.admin.deleteUser(id)).error);
  }, 60000);

  it("D-01/02: reads confirmed, registration-only and wrong-event facts through real Auth and PostgREST", async () => {
    session.client = authorised;
    expect(await readDinnerEligibility(eventId, participantId)).toEqual({ ok: true, eventId, participantId, eligibility: "Eligible" });
    expect(await readDinnerEligibility(eventId.toUpperCase(), participantId.toUpperCase())).toMatchObject({ eligibility: "Eligible" });
    expect(await readDinnerEligibility(eventId, absentParticipantId)).toMatchObject({ eligibility: "Not Eligible Yet" });
    expect(await readDinnerEligibility(otherEventId, participantId)).toMatchObject({ eligibility: "Not Eligible Yet" });
  });

  it("re-reads voided and restored facts without an eligibility write", async () => {
    session.client = authorised;
    for (const [status, eligibility] of [["voided", "Not Eligible Yet"], ["confirmed", "Eligible"]] as const) {
      check((await authorised.from("attendance_records").update({ attendance_status: status })
        .eq("event_id", eventId).eq("participant_id", participantId)).error);
      expect(await readDinnerEligibility(eventId, participantId)).toMatchObject({ eligibility });
    }
  });

  it("denies committee, no-profile and anonymous reads at the real service and RLS boundaries", async () => {
    for (const [db, code] of [[committee, "PERMISSION_DENIED"], [outsider, "PERMISSION_DENIED"], [anonymous, "UNAUTHENTICATED"]] as const) {
      session.client = db;
      expect(await readDinnerEligibility(eventId, participantId)).toEqual({ ok: false, code });
      const rows = await db.from("attendance_records").select("participant_id").eq("event_id", eventId);
      expect(rows.data ?? []).toEqual([]);
    }
  });

  it("preserves the current eligibility when a committee correction cannot change attendance", async () => {
    await committee.from("attendance_records").update({ attendance_status: "voided" })
      .eq("event_id", eventId).eq("participant_id", participantId);
    session.client = authorised;
    expect(await readDinnerEligibility(eventId, participantId)).toMatchObject({ eligibility: "Eligible" });
  });
});
