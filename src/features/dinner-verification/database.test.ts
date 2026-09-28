import { randomUUID, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
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

import { readDinnerEligibility, readDinnerVerification } from "./server";
import { refreshDinnerVerification } from "./actions";
import { manualAttendanceService } from "@/features/attendance/manual/server";
import { attendanceAuditService } from "@/features/attendance/records/server";

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

  async function correction(targetStatus: "confirmed" | "voided") {
    const audit = await attendanceAuditService.listForEvent(eventId);
    if (!audit.ok) throw new Error("Expected authorised audit snapshot");
    const record = audit.items.find((item) => item.participantId === participantId);
    if (!record) throw new Error("Missing fictional attendance");
    const form = new FormData();
    form.set("operation", "correct");
    form.set("recordId", record.id);
    form.set("expectedUpdatedAt", record.updatedAt);
    form.set("targetStatus", targetStatus);
    form.set("confirmation", "confirmed");
    return form;
  }

  function fixtureSql(sql: string) {
    try {
      execFileSync("docker", ["exec", "-i", "supabase_db_MahjongFlow", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"], {
        input: sql, stdio: ["pipe", "pipe", "pipe"], timeout: 30000,
      });
    } catch { throw new Error("Local fictional SQL fixture operation failed"); }
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
      if (role) fixtureSql(`insert into public.profiles (id, display_name, committee_role) values ('${id}', 'Fictional Dinner Tester', '${role}');`);
      check((await db.auth.signInWithPassword({ email, password })).error);
    }
    // SQL is fixture administration only. Repository migrations intentionally do
    // not grant service_role table CRUD; production reads still use user JWTs.
    fixtureSql(`begin;
      insert into public.events (id,name,description,event_type,starts_at,location,created_by) values
      ${[eventId, otherEventId].map((id) => `('${id}','Fictional Issue 35 Event','Disposable local verification','weekly_session','2026-09-28T08:00:00Z','Fictional Room','${users[0]}')`).join(",")};
      insert into public.participants (id,full_name,email) values
      ${[participantId, absentParticipantId].map((id) => `('${id}','Fictional Dinner Attendee','issue35-${id}@example.test')`).join(",")};
      insert into public.registrations (event_id,participant_id,recorded_by) values
      ${[participantId, absentParticipantId].map((id) => `('${eventId}','${id}','${users[0]}')`).join(",")};
      insert into public.attendance_records (event_id,participant_id,check_in_method) values ('${eventId}','${participantId}','qr');
      commit;`);
    session.client = authorised;
  }, 60000);

  afterAll(async () => {
    session.client = null;
    if (!admin) return;
    // Delete only UUID-scoped records created by this test, never reset the DB.
    fixtureSql(`begin;
      delete from public.attendance_records where event_id in ('${eventId}','${otherEventId}');
      delete from public.registrations where event_id in ('${eventId}','${otherEventId}');
      delete from public.events where id in ('${eventId}','${otherEventId}');
      delete from public.participants where id in ('${participantId}','${absentParticipantId}');
      ${users.length ? `delete from public.profiles where id in (${users.map((id) => `'${id}'`).join(",")});` : ""}
      commit;`);
    for (const id of users) check((await admin.auth.admin.deleteUser(id)).error);
  }, 60000);

  it("D-01/02: reads confirmed, registration-only and wrong-event facts through real Auth and PostgREST", async () => {
    session.client = authorised;
    expect(await readDinnerEligibility(eventId, participantId)).toEqual({ ok: true, eventId, participantId, eligibility: "Eligible" });
    expect(await readDinnerEligibility(eventId.toUpperCase(), participantId.toUpperCase())).toMatchObject({ eligibility: "Eligible" });
    expect(await readDinnerEligibility(eventId, absentParticipantId)).toMatchObject({ eligibility: "Not Eligible Yet" });
    expect(await readDinnerEligibility(otherEventId, participantId)).toMatchObject({ eligibility: "Not Eligible Yet" });
  });

  it("D-04: re-reads real #33 void and restore results without an eligibility write", async () => {
    session.client = authorised;
    for (const [status, eligibility] of [["voided", "Not Eligible Yet"], ["confirmed", "Eligible"]] as const) {
      expect(await manualAttendanceService.submit(eventId, await correction(status))).toMatchObject({ status: "success", eventId });
      expect(await readDinnerEligibility(eventId, participantId)).toMatchObject({ eligibility });
      expect(await refreshDinnerVerification(eventId)).toMatchObject({
        ok: true, eligibleCount: status === "confirmed" ? 1 : 0,
        items: [{ participantId, eligibility }],
      });
    }
  });

  it("denies committee, no-profile and anonymous reads at the real service and RLS boundaries", async () => {
    for (const [db, code] of [[committee, "PERMISSION_DENIED"], [outsider, "PERMISSION_DENIED"], [anonymous, "UNAUTHENTICATED"]] as const) {
      session.client = db;
      expect(await readDinnerEligibility(eventId, participantId)).toEqual({ ok: false, code });
      expect(await readDinnerVerification(eventId)).toEqual({ ok: false, code });
      expect(await refreshDinnerVerification(eventId)).toEqual({ ok: false, code });
      const rows = await db.from("attendance_records").select("participant_id").eq("event_id", eventId);
      expect(rows.data ?? []).toEqual([]);
      const participants = await db.from("participants").select("id").eq("id", participantId);
      const registrations = await db.from("registrations").select("id").eq("participant_id", participantId);
      expect(participants.data ?? []).toEqual([]);
      expect(registrations.data ?? []).toEqual([]);
    }
  });

  it("preserves the current eligibility when a committee correction cannot change attendance", async () => {
    session.client = authorised;
    const form = await correction("voided");
    session.client = committee;
    expect(await manualAttendanceService.submit(eventId, form)).toEqual({ status: "permission-denied" });
    session.client = authorised;
    expect(await readDinnerEligibility(eventId, participantId)).toMatchObject({ eligibility: "Eligible" });
    expect(await refreshDinnerVerification(eventId)).toMatchObject({ ok: true, eligibleCount: 1 });
  });

  it("D-03: exposes only necessary identity and a matching current-event aggregate", async () => {
    session.client = authorised;
    const result = await readDinnerVerification(eventId);
    expect(result).toMatchObject({ ok: true, eligibleCount: 1 });
    if (!result.ok) throw new Error("Expected authorised verification");
    expect(Object.keys(result.items[0]).sort()).toEqual(["eligibility", "participantEmail", "participantId", "participantName"]);
    expect(await readDinnerVerification(otherEventId)).toMatchObject({ ok: true, items: [], eligibleCount: 0 });
  });

  it("D-04: a concurrent correction is recalculated from the final database fact", async () => {
    session.client = authorised;
    const form = await correction("voided");
    const changes = await Promise.all([
      manualAttendanceService.submit(eventId, form),
      manualAttendanceService.submit(eventId, form),
    ]);
    expect(changes.map((result) => result.status).sort()).toEqual(["conflict", "success"]);
    const fact = await authorised.from("attendance_records").select("attendance_status").eq("event_id", eventId).eq("participant_id", participantId).single();
    check(fact.error);
    expect(await refreshDinnerVerification(eventId)).toMatchObject({
      ok: true, eligibleCount: fact.data?.attendance_status === "confirmed" ? 1 : 0,
      items: [{ eligibility: fact.data?.attendance_status === "confirmed" ? "Eligible" : "Not Eligible Yet" }],
    });
    // A stale restore cannot make the dinner consumer report eligibility.
    form.set("targetStatus", "confirmed");
    expect(await manualAttendanceService.submit(eventId, form)).toEqual({ status: "conflict" });
    expect(await readDinnerEligibility(eventId, participantId)).toMatchObject({ eligibility: "Not Eligible Yet" });
    expect(await manualAttendanceService.submit(eventId, await correction("confirmed"))).toMatchObject({ status: "success" });
    expect(await refreshDinnerVerification(eventId)).toMatchObject({ ok: true, eligibleCount: 1 });
  });

  it("D-01/04: manual confirmation without registration grants eligibility with no separate write", async () => {
    session.client = authorised;
    fixtureSql(`delete from public.registrations where event_id='${eventId}' and participant_id='${absentParticipantId}';`);
    const form = new FormData();
    form.set("operation", "create");
    form.set("email", `issue35-${absentParticipantId}@example.test`);
    form.set("confirmation", "confirmed");
    expect(await manualAttendanceService.submit(eventId, form)).toMatchObject({ status: "success", eventId });
    expect(await manualAttendanceService.submit(eventId, form)).toEqual({ status: "duplicate" });
    const before = await authorised.from("attendance_records").select("id,updated_at,attendance_status").eq("event_id", eventId).eq("participant_id", absentParticipantId).single();
    check(before.error);
    expect(await readDinnerEligibility(eventId, absentParticipantId)).toMatchObject({ eligibility: "Eligible" });
    const result = await refreshDinnerVerification(eventId);
    expect(result.ok && result.items.some((item) => item.participantId === absentParticipantId && item.eligibility === "Eligible")).toBe(true);
    const after = await authorised.from("attendance_records").select("id,updated_at,attendance_status").eq("event_id", eventId).eq("participant_id", absentParticipantId).single();
    expect(after.data).toEqual(before.data);
  });
});
