import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import type { TaskRecordDTO } from "@/features/tasks/core/contracts";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
const COLUMNS = "id, title, description, assignee_id, due_date, status, source_meeting_id, source_decision_id, source_discussion_point_id, event_id, created_by, created_at, updated_at";

export class EventPreparationRepositoryError extends Error {
  constructor(readonly code?: string) { super("Event preparation persistence failed"); this.name = "EventPreparationRepositoryError"; }
}
export type EventPreparationRepository = Readonly<{ listByEvent(eventId: string): Promise<readonly TaskRecordDTO[]> }>;

function map(row: TaskRow): TaskRecordDTO {
  return { assigneeId: row.assignee_id, createdAt: row.created_at, createdBy: row.created_by, description: row.description, dueDate: row.due_date, eventId: row.event_id, id: row.id, sourceDecisionId: row.source_decision_id, sourceDiscussionPointId: row.source_discussion_point_id, sourceMeetingId: row.source_meeting_id, status: row.status, title: row.title, updatedAt: row.updated_at };
}

export function createEventPreparationRepository(getClient: () => Promise<SupabaseClient<Database>> = createServerSupabaseClient): EventPreparationRepository {
  return { async listByEvent(eventId) { const result = await (await getClient()).from("tasks").select(COLUMNS).eq("event_id", eventId).order("due_date").order("id"); if (result.error) throw new EventPreparationRepositoryError(result.error.code); return (result.data ?? []).map((row) => map(row as TaskRow)); } };
}
