"use server";
import { AuthorizationError, requireAuthorised } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function submitMemberListChange(list: "dinner" | "registration", eventId: string | null, form: FormData) {
  try {
    await requireAuthorised();
    if (!["dinner","registration"].includes(list) || (list === "registration" && (!eventId || !/^[0-9a-f-]{36}$/i.test(eventId)))) return { ok:false, code:"VALIDATION" } as const;
    const client=await createServerSupabaseClient();
    const result=await client.rpc("submit_member_list_change",{
      target_list:list, target_event_id:eventId ?? undefined,
      operation:String(form.get("operation")??""),entry_email:String(form.get("email")??""),
      entry_name:String(form.get("fullName")??""),entry_student_id:String(form.get("studentId")??""),
    });
    if(result.error) return {ok:false,code:result.error.code==="22023" ? "VALIDATION":"UNAVAILABLE"} as const;
    return {ok:true} as const;
  } catch (error) {
    return {ok:false,code:error instanceof AuthorizationError ? "PERMISSION_DENIED" : "UNAVAILABLE"} as const;
  }
}
