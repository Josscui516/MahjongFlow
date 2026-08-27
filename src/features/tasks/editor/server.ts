import "server-only";
import { requireBackendUser } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export type AssigneeOption = Readonly<{ id: string; label: string }>;
export async function listAssigneeOptions(): Promise<readonly AssigneeOption[]> {
  await requireBackendUser();
  const result = await (await createServerSupabaseClient()).from("profiles").select("id, display_name").eq("is_active", true).order("display_name");
  if (result.error) throw result.error;
  return (result.data ?? []).map(({ id, display_name }) => ({ id, label: display_name }));
}
