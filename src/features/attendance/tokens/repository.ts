import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnvironment } from "@/lib/supabase/env";

import type { CheckInTokenRepository, CheckInTokenStatus } from "./contracts";

type RpcError = Readonly<{ code?: string; message?: string }>;
type RpcResult = Promise<Readonly<{ data: unknown; error: RpcError | null }>>;
type RpcClient = Readonly<{
  rpc(name: string, args: Record<string, unknown>): RpcResult;
}>;

export class CheckInTokenPersistenceError extends Error {
  readonly code?: string;

  constructor(error: RpcError) {
    super("Check-in token persistence failed");
    this.name = "CheckInTokenPersistenceError";
    this.code = error.code;
  }
}

function firstRow(value: unknown): Record<string, unknown> | null {
  return Array.isArray(value) && value[0] && typeof value[0] === "object"
    ? (value[0] as Record<string, unknown>)
    : null;
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("Invalid token RPC response");
  return value;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

export function createCheckInTokenAdminClient(): RpcClient {
  const { secretKey, url } = getSupabaseAdminEnvironment();
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  }) as unknown as RpcClient;
}

export function createCheckInTokenRepository(
  getClient: () => RpcClient = createCheckInTokenAdminClient,
): CheckInTokenRepository {
  async function rpc(name: string, args: Record<string, unknown>) {
    const result = await getClient().rpc(name, args);
    if (result.error) throw new CheckInTokenPersistenceError(result.error);
    return result.data;
  }

  return {
    async configureWindow(eventId, actorId, input) {
      const row = firstRow(await rpc("configure_event_check_in_window", {
        actor_id: actorId,
        closes_at: input.closesAt,
        opens_at: input.opensAt,
        target_event_id: eventId,
      }));
      return row
        ? { closesAt: requiredString(row.check_in_closes_at), opensAt: requiredString(row.check_in_opens_at) }
        : null;
    },
    async getStatus(eventId, actorId) {
      const row = firstRow(await rpc("get_event_check_in_token_status", {
        actor_id: actorId,
        target_event_id: eventId,
      }));
      if (!row) return null;
      return {
        active: row.active === true,
        closesAt: optionalString(row.check_in_closes_at),
        createdAt: optionalString(row.created_at),
        opensAt: optionalString(row.check_in_opens_at),
        revokedAt: optionalString(row.revoked_at),
      } satisfies CheckInTokenStatus;
    },
    async revoke(eventId, actorId) {
      return requiredString(await rpc("revoke_event_check_in_token", {
        actor_id: actorId,
        target_event_id: eventId,
      }));
    },
    async rotate(eventId, actorId) {
      const row = firstRow(await rpc("rotate_event_check_in_token", {
        actor_id: actorId,
        target_event_id: eventId,
      }));
      return row
        ? { createdAt: requiredString(row.created_at), token: requiredString(row.token) }
        : null;
    },
  };
}

export const checkInTokenRepository = createCheckInTokenRepository();
