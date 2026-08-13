import "server-only";

import { resolveAuthenticatedUser } from "@/lib/auth/authenticated-user";
import type { AuthenticatedUserResult } from "@/lib/auth/contracts";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser(): Promise<AuthenticatedUserResult> {
  return resolveAuthenticatedUser(async () => {
    const supabase = await createServerSupabaseClient();

    return supabase.auth.getUser();
  });
}
