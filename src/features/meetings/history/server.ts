import "server-only";

import { cache } from "react";

import {
  AuthorizationError,
  requireBackendUser,
} from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { MeetingHistoryAccessResult } from "./contracts";
import { createMeetingHistoryQuery } from "./query-adapter";

const MEETING_HISTORY_COLUMNS = "id,title,starts_at,summary";

async function resolveMeetingHistoryAccess(): Promise<MeetingHistoryAccessResult> {
  try {
    const context = await requireBackendUser();

    return { context, ok: true };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        ok: false,
        reason:
          error.code === "UNAUTHENTICATED"
            ? "unauthenticated"
            : "forbidden",
      };
    }

    return { ok: false, reason: "system-error" };
  }
}

export const getMeetingHistoryAccess = cache(resolveMeetingHistoryAccess);

export const queryMeetingHistory = createMeetingHistoryQuery(async () => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("meetings")
    .select(MEETING_HISTORY_COLUMNS)
    .order("starts_at", { ascending: false })
    .order("id", { ascending: true });

  return { data, error };
});
