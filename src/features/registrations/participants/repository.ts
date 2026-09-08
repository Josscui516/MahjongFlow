import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";

import type {
  ParticipantIdentityDTO,
  ParticipantIdentityInput,
} from "./contracts";

type ParticipantRow = Database["public"]["Tables"]["participants"]["Row"];

const PARTICIPANT_SELECT =
  "id, full_name, email, student_id, created_at, updated_at";

export class ParticipantRepositoryError extends Error {
  constructor(
    readonly code: string | undefined,
    message = "Participant persistence failed",
  ) {
    super(message);
    this.name = "ParticipantRepositoryError";
  }
}

export type ParticipantRepositoryResolution =
  | Readonly<{
      outcome: "created" | "matched";
      participant: ParticipantIdentityDTO;
    }>
  | Readonly<{ outcome: "conflict" }>;

export type ParticipantRepository = Readonly<{
  resolve: (
    input: ParticipantIdentityInput,
  ) => Promise<ParticipantRepositoryResolution>;
}>;

function fail(error: { code?: string; message: string }): never {
  throw new ParticipantRepositoryError(error.code, error.message);
}

function mapParticipant(row: ParticipantRow): ParticipantIdentityDTO {
  return {
    createdAt: row.created_at,
    email: row.email,
    fullName: row.full_name,
    id: row.id,
    studentId: row.student_id,
    updatedAt: row.updated_at,
  };
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

async function findByEmail(
  client: SupabaseClient<Database>,
  email: string,
): Promise<ParticipantRow | null> {
  const result = await client
    .from("participants")
    .select(PARTICIPANT_SELECT)
    .eq("email", email)
    .maybeSingle();

  if (result.error) fail(result.error);
  return (result.data as ParticipantRow | null) ?? null;
}

async function reconcileMatchedParticipant(
  client: SupabaseClient<Database>,
  row: ParticipantRow,
  input: ParticipantIdentityInput,
): Promise<ParticipantRepositoryResolution> {
  if (!input.studentId || row.student_id === input.studentId) {
    return { outcome: "matched", participant: mapParticipant(row) };
  }

  if (row.student_id) return { outcome: "conflict" };

  const update = await client
    .from("participants")
    .update({ student_id: input.studentId })
    .eq("id", row.id)
    .is("student_id", null)
    .select(PARTICIPANT_SELECT)
    .maybeSingle();

  if (isUniqueViolation(update.error)) return { outcome: "conflict" };
  if (update.error) fail(update.error);
  if (update.data) {
    return {
      outcome: "matched",
      participant: mapParticipant(update.data as ParticipantRow),
    };
  }

  // A concurrent resolver may have filled the missing student ID after the
  // first read. Re-read once and accept only the same final identity.
  const refreshed = await findByEmail(client, input.email);
  if (refreshed?.student_id === input.studentId) {
    return {
      outcome: "matched",
      participant: mapParticipant(refreshed),
    };
  }

  return { outcome: "conflict" };
}

export function createParticipantRepository(
  getClient: () => Promise<SupabaseClient<Database>> =
    createServerSupabaseClient,
): ParticipantRepository {
  return {
    async resolve(input) {
      const client = await getClient();
      const existing = await findByEmail(client, input.email);

      if (existing) {
        return reconcileMatchedParticipant(client, existing, input);
      }

      const insert = await client
        .from("participants")
        .insert({
          email: input.email,
          full_name: input.fullName,
          student_id: input.studentId,
        })
        .select(PARTICIPANT_SELECT)
        .single();

      if (!insert.error) {
        return {
          outcome: "created",
          participant: mapParticipant(insert.data as ParticipantRow),
        };
      }

      if (!isUniqueViolation(insert.error)) fail(insert.error);

      // The email unique constraint serialises concurrent create attempts. If
      // another request won, re-read its committed row and return a match.
      const racedParticipant = await findByEmail(client, input.email);
      if (!racedParticipant) return { outcome: "conflict" };

      return reconcileMatchedParticipant(client, racedParticipant, input);
    },
  };
}
