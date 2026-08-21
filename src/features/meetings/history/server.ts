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

function escapeIlikePattern(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

export const queryMeetingHistory = createMeetingHistoryQuery(async (criteria) => {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("meetings")
    .select(MEETING_HISTORY_COLUMNS, { count: "exact" });

  if (criteria.search) {
    query = query.ilike("title", `%${escapeIlikePattern(criteria.search)}%`);
  }

  const now = new Date().toISOString();

  if (criteria.time === "past") {
    query = query.lt("starts_at", now);
  } else if (criteria.time === "upcoming") {
    query = query.gte("starts_at", now);
  }

  const rangeStart = (criteria.page - 1) * criteria.pageSize;
  const rangeEnd = rangeStart + criteria.pageSize - 1;
  const { count, data, error } = await query
    .order("starts_at", { ascending: criteria.sort === "oldest" })
    .order("id", { ascending: true })
    .range(rangeStart, rangeEnd);

  return { count, data, error };
});
