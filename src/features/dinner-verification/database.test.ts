import { randomUUID, randomBytes, createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Database } from "@/types/database.generated";
vi.mock("server-only", () => ({}));
const session = vi.hoisted(() => ({ client: null as SupabaseClient<Database> | null }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: async () => { if (!session.client) throw new Error("Missing test session"); return session.client; } }));
import { readDinnerVerification } from "./server";
import { readGlobalDinnerRoster, saveDinnerRosterEntry, removeDinnerRosterEntry } from "./roster";

describe.skipIf(process.env.ISSUE35_LIVE_DATABASE !== "1")("independent public registration and dinner roster: real local RLS", () => {
  const eventId=randomUUID(), token=randomBytes(32).toString("hex"), email=`registration-${randomUUID()}@example.test`, rosterEmail=`dinner-${randomUUID()}@example.test`;
  const users:string[]=[];
  const studentEvent=randomUUID(), studentToken=randomBytes(32).toString("hex"), studentEmail=`student-${randomUUID()}@example.test`;
  let privileged:SupabaseClient<Database>, committee:SupabaseClient<Database>, authorised:SupabaseClient<Database>, manager:SupabaseClient<Database>, anonymous:SupabaseClient<Database>;
  const sql=(query:string)=>execFileSync("docker",["exec","-i","supabase_db_MahjongFlow","psql","-U","postgres","-d","postgres","-At","-v","ON_ERROR_STOP=1"],{input:query,encoding:"utf8",stdio:["pipe","pipe","pipe"]}).trim();
  beforeAll(async()=>{
    const env=Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(Boolean).map(line=>{const i=line.indexOf("=");return[line.slice(0,i),line.slice(i+1)];}));
    if(!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(env.NEXT_PUBLIC_SUPABASE_URL))throw new Error("Local-only test");
    const options={auth:{persistSession:false}};
    privileged=createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SECRET_KEY,options);
    anonymous=createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,options);
    async function user(role:"committee"|"authorised",manages=false){
      const password=randomBytes(24).toString("base64url"), address=`roster-test-${randomUUID()}@example.test`;
      const r=await privileged.auth.admin.createUser({email:address,password,email_confirm:true});if(r.error||!r.data.user)throw new Error("Test account setup failed");
      const id=r.data.user.id;users.push(id);sql(`insert into public.profiles(id,display_name,committee_role,can_manage_accounts)values('${id}','Fictional roster tester','${role}',${manages});`);
      const c=createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,options);if((await c.auth.signInWithPassword({email:address,password})).error)throw new Error("Test login failed");return c;
    }
    committee=await user("committee");authorised=await user("authorised");manager=await user("authorised",true);
    sql(`insert into public.events(id,name,event_type,location,description,starts_at,check_in_opens_at,check_in_closes_at,created_by)values('${eventId}','Fictional separated-flow test','weekly_session','Test room','Fictional test',now(),now()-interval '1 hour',now()+interval '1 hour','${users[2]}');insert into public.event_check_in_tokens(event_id,token_digest,created_by)values('${eventId}','${createHash("sha256").update(token).digest("hex")}','${users[2]}');`);
    sql(`insert into public.events(id,name,event_type,location,description,starts_at,check_in_opens_at,check_in_closes_at,requires_student_id,created_by)values('${studentEvent}','Fictional student registration test','weekly_session','Test room','Fictional test',now(),now()-interval '1 hour',now()+interval '1 hour',true,'${users[2]}');insert into public.event_check_in_tokens(event_id,token_digest,created_by)values('${studentEvent}','${createHash("sha256").update(studentToken).digest("hex")}','${users[2]}');`);
  },30000);
  afterAll(async()=>{
    session.client=null;if(!users.length||!privileged)return;
    sql(`delete from public.event_dinner_issuance where event_id='${eventId}';delete from public.dinner_eligibility_roster where recorded_by in (${users.map(id=>`'${id}'`).join(',')});delete from public.attendance_records where event_id='${eventId}';delete from public.registrations where event_id='${eventId}';delete from public.events where id='${eventId}';delete from public.participants where email in ('${email}','${rosterEmail}');`);
    sql(`delete from public.registrations where event_id='${studentEvent}';delete from public.events where id='${studentEvent}';delete from public.participants where email='${studentEmail}';`);
    for(const id of users){sql(`delete from public.profiles where id='${id}';`);await privileged.auth.admin.deleteUser(id);}
  });
  it("keeps the internal registration-only primitive independent from attendance and dinner entitlement",async()=>{
    const args={registration_token:token,participant_name:"Fictional New Registrant",participant_email:email,privacy_accepted:true};
    expect((await privileged.rpc("submit_event_registration",args)).data).toBe("success");
    expect((await privileged.rpc("submit_event_registration",args)).data).toBe("already_processed");
    expect(sql(`select count(*) from public.registrations where event_id='${eventId}';`)).toBe("1");
    expect(sql(`select count(*) from public.attendance_records where event_id='${eventId}';`)).toBe("0");
    session.client=authorised;expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:0,items:[]});
    sql(`insert into public.attendance_records(event_id,participant_id,checked_in_at,check_in_method,attendance_status,recorded_by)select '${eventId}',id,now(),'manual','confirmed','${users[2]}' from public.participants where email='${email}';`);
    expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:0,items:[]});
  });
  it("matches an independently preloaded email only after registration and confirmed check-in, recalculating corrections",async()=>{
    session.client=manager;expect(await saveDinnerRosterEntry("Fictional Dinner Member",`  ${rosterEmail.toUpperCase()}  `)).toEqual({ok:true});
    expect(await saveDinnerRosterEntry("Fictional Dinner Member",rosterEmail)).toEqual({ok:true});
    expect(sql(`select count(*) from public.dinner_eligibility_roster where email='${rosterEmail}';`)).toBe("1");
    const internal=await readGlobalDinnerRoster();expect(internal).toMatchObject({ok:true,items:expect.arrayContaining([expect.objectContaining({participantEmail:rosterEmail,status:"listed"})])});
    session.client=authorised;expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:0,items:[]});
    expect((await privileged.rpc("submit_event_registration",{registration_token:token,participant_name:"Fictional Registered Attendee",participant_email:` ${rosterEmail.toUpperCase()} `,privacy_accepted:true})).data).toBe("success");
    expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:0,items:[]});
    const scanned=await Promise.all([1,2].map(()=>privileged.rpc("submit_event_self_check_in",{registration_token:token,participant_name:"Fictional Registered Attendee",participant_email:rosterEmail,privacy_accepted:true})));
    expect(scanned.map(result=>result.data).sort()).toEqual(["already_processed","success"]);
    expect(sql(`select count(*) from public.attendance_records a join public.participants p on p.id=a.participant_id where a.event_id='${eventId}' and p.email='${rosterEmail}' and a.check_in_method='qr' and a.recorded_by is null;`)).toBe("1");
    const r=await readDinnerVerification(eventId);expect(r).toMatchObject({ok:true,eligibleCount:1});if(!r.ok||!internal.ok)throw new Error("Roster read failed");
    expect(r.items[0]).toMatchObject({participantEmail:rosterEmail,eligibility:"Eligible"});
    expect(r.items[0].participantName).toBe("Fictional Registered Attendee");
    expect(r.items[0].participantId).not.toBe(internal.items.find(item=>item.participantEmail===rosterEmail)!.participantId);
    const servingArgs={target_event_id:eventId,target_participant_id:r.items[0].participantId,desired_issued:true,expected_issued:false};
    const served=await Promise.all([authorised.rpc("set_event_dinner_issued",servingArgs),authorised.rpc("set_event_dinner_issued",servingArgs)]);
    expect(served.every(result=>!result.error&&result.data)).toBe(true);
    expect(served[0].data).toBe(served[1].data);
    expect(sql(`select count(*) from public.event_dinner_issuance where event_id='${eventId}' and participant_id='${r.items[0].participantId}';`)).toBe("1");
    expect((await authorised.rpc("set_event_dinner_issued",{...servingArgs,desired_issued:false,expected_issued:true})).error).toBeNull();
    expect((await authorised.from("attendance_records").update({attendance_status:"voided"}).eq("event_id",eventId).eq("participant_id",r.items[0].participantId)).error).toBeNull();
    expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:0,items:[]});
    sql(`update public.attendance_records set attendance_status='confirmed' where event_id='${eventId}' and participant_id='${r.items[0].participantId}';`);
    expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:1});
    sql(`update public.registrations set registration_status='cancelled' where event_id='${eventId}' and participant_id='${r.items[0].participantId}';`);
    expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:0,items:[]});
    sql(`update public.registrations set registration_status='registered' where event_id='${eventId}' and participant_id='${r.items[0].participantId}';`);
    session.client=manager;expect(await removeDinnerRosterEntry(internal.items.find(item=>item.participantEmail===rosterEmail)!.participantId)).toEqual({ok:true});
    expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:0,items:[]});
    expect(await saveDinnerRosterEntry("Fictional Dinner Member",rosterEmail)).toEqual({ok:true});
    expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:1});
    sql(`delete from public.attendance_records where event_id='${eventId}' and participant_id='${r.items[0].participantId}';delete from public.registrations where event_id='${eventId}' and participant_id='${r.items[0].participantId}';`);
  });
  it("allows safety staff to maintain membership without developer privileges",async()=>{
    session.client=authorised;expect(await saveDinnerRosterEntry("Fictional Safety Writer",`safety-${eventId}@example.test`)).toEqual({ok:true});
    expect((await authorised.from("dinner_eligibility_roster").insert({full_name:"Fictional Denied",email:`direct-${eventId}@example.test`})).error).toBeNull();
  });
  it("allows committee distribution while denying full roster reads and direct elevated RPC calls",async()=>{
    session.client=committee;expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:0,items:[]});
    expect((await committee.from("dinner_eligibility_roster").select("id")).data).toEqual([]);
    expect((await anonymous.from("dinner_roster").select("id")).error).not.toBeNull();
    const args={registration_token:token,participant_name:"Fictional Probe",participant_email:"probe@example.test",privacy_accepted:true};
    expect((await anonymous.rpc("submit_event_registration",args)).error).not.toBeNull();expect((await committee.rpc("submit_event_registration",args)).error).not.toBeNull();
  });
  it("rejects missing consent and invalid tokens without changing registrations",async()=>{
    expect((await privileged.rpc("submit_event_registration",{registration_token:token,participant_name:"Fictional Probe",participant_email:"probe@example.test",privacy_accepted:false})).data).toBe("unable_to_process");
    expect((await privileged.rpc("submit_event_registration",{registration_token:"invalid",participant_name:"Fictional Probe",participant_email:"probe@example.test",privacy_accepted:true})).data).toBe("unavailable");
    expect(sql(`select count(*) from public.registrations where event_id='${eventId}';`)).toBe("1");
  });
  it("does not restore a staff-cancelled registration through a public resubmission",async()=>{
    sql(`update public.registrations set registration_status='cancelled' where event_id='${eventId}';`);
    expect((await privileged.rpc("submit_event_registration",{registration_token:token,participant_name:"Fictional New Registrant",participant_email:email,privacy_accepted:true})).data).toBe("unable_to_process");
    expect(sql(`select registration_status from public.registrations where event_id='${eventId}';`)).toBe("cancelled");
  });
  it("requires the configured student ID and creates only one registration during concurrent submissions",async()=>{
    const args={registration_token:studentToken,participant_name:"Fictional Student",participant_email:studentEmail,privacy_accepted:true};
    expect((await privileged.rpc("submit_event_registration",args)).data).toBe("unable_to_process");
    const results=await Promise.all([1,2,3].map(()=>privileged.rpc("submit_event_registration",{...args,participant_student_id:"FAKE-61004"})));
    expect(results.map(result=>result.data).sort()).toEqual(["already_processed","already_processed","success"]);
    expect(sql(`select count(*) from public.registrations where event_id='${studentEvent}';`)).toBe("1");
    expect(sql(`select count(*) from public.attendance_records where event_id='${studentEvent}';`)).toBe("0");
  });
  it("rejects closed registration windows and revoked tokens",async()=>{
    const args={registration_token:studentToken,participant_name:"Fictional Student",participant_email:studentEmail,participant_student_id:"FAKE-61004",privacy_accepted:true};
    sql(`update public.events set check_in_closes_at=now()-interval '1 second' where id='${studentEvent}';`);
    expect((await privileged.rpc("submit_event_registration",args)).data).toBe("unavailable");
    sql(`update public.events set check_in_closes_at=now()+interval '1 hour' where id='${studentEvent}';update public.event_check_in_tokens set revoked_at=now() where event_id='${studentEvent}';`);
    expect((await privileged.rpc("submit_event_registration",args)).data).toBe("unavailable");
  });
});
