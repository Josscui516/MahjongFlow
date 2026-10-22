import { createClient } from "@supabase/supabase-js";
import { expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
vi.mock("@/lib/supabase/server",()=>({createServerSupabaseClient:vi.fn()}));
import { AuthorizationError } from "@/lib/auth/authorization";
import { createEventDeleter } from "./delete";
import type { Database } from "@/types/database.generated";
const id="e4444444-4444-4444-8444-444444444444";
const authorise=async()=>({canManageAccounts:false,userId:id,role:"committee" as const});
it.each([["deleted",{ok:true}],["not_found",{ok:false,code:"NOT_FOUND"}],["linked_records",{ok:false,code:"LINKED_RECORDS"}],["unexpected",{ok:false,code:"SYSTEM_ERROR"}]])("maps RPC outcome %s without exposing records",async(data,expected)=>{
 const client=createClient<Database>("https://events.example.test","fictional",{auth:{persistSession:false},global:{fetch:async()=>new Response(JSON.stringify(data),{headers:{"Content-Type":"application/json"}})}});
 expect(await createEventDeleter({authorise,getClient:async()=>client})(id)).toEqual(expected);
});
it("rejects anonymous and malformed requests before database access",async()=>{
 const getClient=vi.fn();
 expect(await createEventDeleter({authorise:async()=>{throw new AuthorizationError("UNAUTHENTICATED");},getClient})(id)).toEqual({ok:false,code:"PERMISSION_DENIED"});
 expect(await createEventDeleter({authorise,getClient})("invalid")).toEqual({ok:false,code:"NOT_FOUND"});
 expect(getClient).not.toHaveBeenCalled();
});
it("maps unexpected persistence failures safely",async()=>{
 expect(await createEventDeleter({authorise,getClient:async()=>{throw Error("private diagnostic");}})(id)).toEqual({ok:false,code:"SYSTEM_ERROR"});
});
