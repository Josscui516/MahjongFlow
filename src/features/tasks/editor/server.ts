import "server-only";
import { requireBackendUser } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export type AssigneeOption = Readonly<{ id: string; label: string }>;
export async function listTaskMeetingOptions(): Promise<readonly AssigneeOption[]> {
  await requireBackendUser();
  const client = await createServerSupabaseClient();
  const options: AssigneeOption[] = [];
  for (let start = 0; ; start += 250) {
    const result = await client.from("meetings").select("id, title")
      .order("starts_at", { ascending: false }).order("id").range(start, start + 249);
    if (result.error) throw result.error;
    options.push(...(result.data ?? []).map(({ id, title }) => ({ id, label: title })));
    if ((result.data?.length ?? 0) < 250) return options;
  }
}
export async function listAssigneeOptions(): Promise<readonly AssigneeOption[]> {
  await requireBackendUser();
  const result = await (await createServerSupabaseClient()).from("profiles").select("id, display_name").eq("is_active", true).order("display_name");
  if (result.error) throw result.error;
  return (result.data ?? []).map(({ id, display_name }) => ({ id, label: display_name }));
}
