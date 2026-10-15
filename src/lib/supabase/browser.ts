import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnvironment, getSupabaseAuthOptions } from "@/lib/supabase/env";

export function createBrowserSupabaseClient() {
  const { publishableKey, url } = getSupabasePublicEnvironment();

  return createBrowserClient(url, publishableKey, { auth: getSupabaseAuthOptions() });
}
