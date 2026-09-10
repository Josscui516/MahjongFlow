import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { Database } from "@/types/database.generated";

import type { ParticipantIdentityInput } from "./contracts";
import { FICTIONAL_PARTICIPANT } from "./fixtures";
import {
  createParticipantRepository,
  ParticipantRepositoryError,
} from "./repository";

type ParticipantRow = Database["public"]["Tables"]["participants"]["Row"];
type QueryResult = Readonly<{ data: ParticipantRow | null; error: DbError | null }>;
type DbError = Readonly<{ code?: string; message: string }>;

const INPUT: ParticipantIdentityInput = {
  email: FICTIONAL_PARTICIPANT.email,
  fullName: FICTIONAL_PARTICIPANT.fullName,
  studentId: FICTIONAL_PARTICIPANT.studentId,
};

const ROW: ParticipantRow = {
  created_at: FICTIONAL_PARTICIPANT.createdAt,
  email: FICTIONAL_PARTICIPANT.email,
  full_name: FICTIONAL_PARTICIPANT.fullName,
  id: FICTIONAL_PARTICIPANT.id,
  student_id: FICTIONAL_PARTICIPANT.studentId,
  updated_at: FICTIONAL_PARTICIPANT.updatedAt,
};

function ok(data: ParticipantRow | null): QueryResult {
  return { data, error: null };
}

function failed(code: string): QueryResult {
  return { data: null, error: { code, message: "database detail" } };
}

function createScriptedClient(script: Readonly<{
  inserts?: readonly QueryResult[];
  reads?: readonly QueryResult[];
  updates?: readonly QueryResult[];
}>) {
  const inserts = [...(script.inserts ?? [])];
  const reads = [...(script.reads ?? [])];
  const updates = [...(script.updates ?? [])];
  const insertedPayloads: unknown[] = [];
  const updatedPayloads: unknown[] = [];

  const from = vi.fn(() => ({
    insert(payload: unknown) {
      insertedPayloads.push(payload);
      return {
        select() {
          return {
            async single() {
              return inserts.shift() ?? failed("NO_INSERT_SCRIPT");
            },
          };
        },
      };
    },
    select() {
      return {
        eq() {
          return {
            async maybeSingle() {
              return reads.shift() ?? failed("NO_READ_SCRIPT");
            },
          };
        },
      };
    },
    update(payload: unknown) {
      updatedPayloads.push(payload);
      return {
        eq() {
          return {
            is() {
              return {
                select() {
                  return {
                    async maybeSingle() {
                      return updates.shift() ?? failed("NO_UPDATE_SCRIPT");
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  }));

  return {
    client: { from } as unknown as SupabaseClient<Database>,
    from,
    insertedPayloads,
    updatedPayloads,
  };
}

describe("createParticipantRepository", () => {
  it("creates a participant with only the three approved input columns", async () => {
    const scripted = createScriptedClient({
      inserts: [ok(ROW)],
      reads: [ok(null)],
    });
    const repository = createParticipantRepository(async () => scripted.client);

    await expect(repository.resolve(INPUT)).resolves.toEqual({
      outcome: "created",
      participant: FICTIONAL_PARTICIPANT,
    });
    expect(scripted.insertedPayloads).toEqual([
      {
        email: INPUT.email,
        full_name: INPUT.fullName,
        student_id: INPUT.studentId,
      },
    ]);
  });

  it("matches an existing participant by normalised email without rewriting it", async () => {
    const scripted = createScriptedClient({ reads: [ok(ROW)] });
    const repository = createParticipantRepository(async () => scripted.client);

    await expect(repository.resolve(INPUT)).resolves.toEqual({
      outcome: "matched",
      participant: FICTIONAL_PARTICIPANT,
    });
    expect(scripted.insertedPayloads).toEqual([]);
    expect(scripted.updatedPayloads).toEqual([]);
  });

  it("atomically fills a missing student ID on an email match", async () => {
    const missingId = { ...ROW, student_id: null };
    const scripted = createScriptedClient({
      reads: [ok(missingId)],
      updates: [ok(ROW)],
    });
    const repository = createParticipantRepository(async () => scripted.client);

    await expect(repository.resolve(INPUT)).resolves.toEqual({
      outcome: "matched",
      participant: FICTIONAL_PARTICIPANT,
    });
    expect(scripted.updatedPayloads).toEqual([
      { student_id: INPUT.studentId },
    ]);
  });

  it("returns a conflict when the matched email already has another student ID", async () => {
    const scripted = createScriptedClient({
      reads: [ok({ ...ROW, student_id: "OTHER-2601" })],
    });
    const repository = createParticipantRepository(async () => scripted.client);

    await expect(repository.resolve(INPUT)).resolves.toEqual({
      outcome: "conflict",
    });
    expect(scripted.updatedPayloads).toEqual([]);
  });

  it("re-reads and matches the winner of a concurrent email insert", async () => {
    const scripted = createScriptedClient({
      inserts: [failed("23505")],
      reads: [ok(null), ok(ROW)],
    });
    const repository = createParticipantRepository(async () => scripted.client);

    await expect(repository.resolve(INPUT)).resolves.toEqual({
      outcome: "matched",
      participant: FICTIONAL_PARTICIPANT,
    });
  });

  it("does not misidentify a student-ID uniqueness conflict as an email match", async () => {
    const scripted = createScriptedClient({
      inserts: [failed("23505")],
      reads: [ok(null), ok(null)],
    });
    const repository = createParticipantRepository(async () => scripted.client);

    await expect(repository.resolve(INPUT)).resolves.toEqual({
      outcome: "conflict",
    });
  });

  it("keeps raw database details behind a typed repository error", async () => {
    const scripted = createScriptedClient({ reads: [failed("42501")] });
    const repository = createParticipantRepository(async () => scripted.client);

    await expect(repository.resolve(INPUT)).rejects.toEqual(
      expect.objectContaining<Partial<ParticipantRepositoryError>>({
        code: "42501",
        name: "ParticipantRepositoryError",
      }),
    );
  });
});
