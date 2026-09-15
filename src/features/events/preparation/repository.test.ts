import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { Database } from "@/types/database.generated";
import { createEventPreparationRepository } from "./repository";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

const taskId = "22222222-2222-4222-8222-222222222222";
const eventId = "11111111-1111-4111-8111-111111111111";
const row = {
  assignee_id: "33333333-3333-4333-8333-333333333333",
  created_at: "2026-09-01T00:00:00Z",
  created_by: taskId,
  description: "Changed concurrently",
  due_date: "2026-09-19",
  event_id: eventId,
  id: taskId,
  source_decision_id: null,
  source_discussion_point_id: null,
  source_meeting_id: null,
  status: "completed",
  title: "Concurrent title",
  updated_at: "2026-09-10T00:00:00Z",
} satisfies TaskRow;

describe("event preparation repository", () => {
  it("updates only event_id so concurrent task edits survive", async () => {
    const payloads: unknown[] = [];
    const maybeSingle = vi.fn(async () => ({ data: row, error: null }));
    const select = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn((payload: unknown) => {
      payloads.push(payload);
      return { eq };
    });
    const client = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient<Database>;
    const repository = createEventPreparationRepository(async () => client);

    await expect(repository.setEvent(taskId, eventId)).resolves.toMatchObject({
      assigneeId: row.assignee_id,
      eventId,
      status: "completed",
      title: "Concurrent title",
    });
    expect(payloads).toEqual([{ event_id: eventId }]);
    expect(eq).toHaveBeenCalledWith("id", taskId);
  });
});
