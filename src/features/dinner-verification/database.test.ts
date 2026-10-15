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
import { saveDinnerRosterEntry, removeDinnerRosterEntry } from "./roster";

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
    sql(`delete from public.dinner_roster where event_id='${eventId}';delete from public.attendance_records where event_id='${eventId}';delete from public.registrations where event_id='${eventId}';delete from public.events where id='${eventId}';delete from public.participants where email='${email}';`);
    sql(`delete from public.registrations where event_id='${studentEvent}';delete from public.events where id='${studentEvent}';delete from public.participants where email='${studentEmail}';`);
    for(const id of users){sql(`delete from public.profiles where id='${id}';`);await privileged.auth.admin.deleteUser(id);}
  });
  it("creates a first registration from a new email without attendance or dinner entitlement",async()=>{
    const args={registration_token:token,participant_name:"Fictional New Registrant",participant_email:email,privacy_accepted:true};
    expect((await privileged.rpc("submit_event_registration",args)).data).toBe("success");
    expect((await privileged.rpc("submit_event_registration",args)).data).toBe("already_processed");
    expect(sql(`select count(*) from public.registrations where event_id='${eventId}';`)).toBe("1");
    expect(sql(`select count(*) from public.attendance_records where event_id='${eventId}';`)).toBe("0");
    session.client=authorised;expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:0,items:[]});
    sql(`insert into public.attendance_records(event_id,participant_id,checked_in_at,check_in_method,attendance_status,recorded_by)select '${eventId}',id,now(),'manual','confirmed','${users[2]}' from public.participants where email='${email}';`);
    expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:0,items:[]});
  });
  it("lets an administrator preload dinner independently of registration and remove membership",async()=>{
    session.client=manager;expect(await saveDinnerRosterEntry(eventId,"Fictional Dinner Member",rosterEmail)).toEqual({ok:true});
    expect(await saveDinnerRosterEntry(eventId,"Fictional Dinner Member",rosterEmail)).toEqual({ok:true});
    expect(sql(`select count(*) from public.dinner_roster where event_id='${eventId}';`)).toBe("1");
    session.client=authorised;const r=await readDinnerVerification(eventId);expect(r).toMatchObject({ok:true,eligibleCount:1});if(!r.ok)throw new Error("Roster read failed");
    expect(r.items[0]).toMatchObject({participantEmail:rosterEmail,eligibility:"Eligible"});
    session.client=manager;expect(await removeDinnerRosterEntry(eventId,r.items[0].participantId)).toEqual({ok:true});
    expect(await readDinnerVerification(eventId)).toMatchObject({ok:true,eligibleCount:0});
  });
  it("denies roster writes to an authorised nonadministrator at both boundaries",async()=>{
    session.client=authorised;expect(await saveDinnerRosterEntry(eventId,"Fictional Denied","denied@example.test")).toMatchObject({ok:false,code:"PERMISSION_DENIED"});
    expect((await authorised.from("dinner_roster").insert({event_id:eventId,full_name:"Fictional Denied",email:"denied@example.test"})).error).not.toBeNull();
  });
  it("denies committee and anonymous roster reads and direct privileged RPC calls",async()=>{
    session.client=committee;expect(await readDinnerVerification(eventId)).toMatchObject({ok:false,code:"PERMISSION_DENIED"});
    expect((await committee.from("dinner_roster").select("id").eq("event_id",eventId)).data).toEqual([]);
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
