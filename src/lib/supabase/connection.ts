import "server-only";

import { getSupabasePublicEnvironment } from "@/lib/supabase/env";

export type SupabaseConnectionStatus =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: "configuration" | "rejected" | "unreachable" }>;

export async function verifySupabaseConnection(): Promise<SupabaseConnectionStatus> {
  let publishableKey: string;
  let url: string;

  try {
    ({ publishableKey, url } = getSupabasePublicEnvironment());
  } catch {
    return { ok: false, reason: "configuration" };
  }

  try {
    const response = await fetch(new URL("/auth/v1/settings", url), {
      cache: "no-store",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return { ok: false, reason: "rejected" };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}
