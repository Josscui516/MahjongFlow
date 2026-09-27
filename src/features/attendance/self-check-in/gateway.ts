import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnvironment } from "@/lib/supabase/env";
import type { Database } from "@/types/database.generated";
import type {
  CheckInContextResult,
  CheckInRateLimiter,
  SelfCheckInGateway,
  SelfCheckInOutcome,
} from "./contracts";

type RateLimitRpcClient = Readonly<{
  rpc(
    name: "consume_check_in_rate_limit",
    args: Readonly<{
      maximum_attempts: number;
      source_fingerprint: string;
      window_seconds: number;
    }>,
  ): PromiseLike<Readonly<{ data: boolean | null; error: unknown }>>;
}>;

const OUTCOMES = new Set<SelfCheckInOutcome>([
  "success",
  "already_processed",
  "unable_to_process",
  "unavailable",
]);

function createTrustedClient() {
  const { secretKey, url } = getSupabaseAdminEnvironment();
  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

export function createSelfCheckInGateway(): SelfCheckInGateway {
  const client = createTrustedClient();
  return {
    async getContext(token) {
      const { data, error } = await client.rpc("get_check_in_context", { check_in_token: token });
      if (error) return { code: "SYSTEM_ERROR", ok: false };
      const row = data?.[0];
      if (!row || row.result !== "available") return { code: "UNAVAILABLE", ok: false };
      return {
        context: {
          eventName: row.event_name,
          location: row.location,
          startsAt: row.starts_at,
          studentIdRequired: row.student_id_required,
        },
        ok: true,
      } satisfies CheckInContextResult;
    },
    async submit(input) {
      const { data, error } = await client.rpc("submit_event_check_in", {
        check_in_token: input.token,
        participant_email: input.email,
        participant_student_id: input.studentId ?? undefined,
      });
      if (error || typeof data !== "string" || !OUTCOMES.has(data as SelfCheckInOutcome)) return "system_error";
      return data as SelfCheckInOutcome;
    },
  };
}

export function createDatabaseCheckInRateLimiter(): CheckInRateLimiter {
  const client = createTrustedClient() as unknown as RateLimitRpcClient;
  return {
    async consume(fingerprint) {
      const { data, error } = await client.rpc("consume_check_in_rate_limit", {
        maximum_attempts: 10,
        source_fingerprint: fingerprint,
        window_seconds: 60,
      });
      if (error || typeof data !== "boolean") throw new Error("CHECK_IN_RATE_LIMIT_UNAVAILABLE");
      return data;
    },
  };
}
