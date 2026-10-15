import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import type { TaskInput, TaskRecordDTO } from "./contracts";
import type { TaskFilterCriteria } from "../list/search-params";

export class TaskRepositoryError extends Error {
  constructor(readonly code: string | undefined, message = "Task persistence failed") { super(message); this.name = "TaskRepositoryError"; }
}
export type TaskRepository = Readonly<{
  create: (actorId: string, input: TaskInput) => Promise<TaskRecordDTO>;
  delete: (taskId: string) => Promise<"deleted" | "not_found">;
  get: (taskId: string) => Promise<TaskRecordDTO | null>;
  list: () => Promise<readonly TaskRecordDTO[]>;
  query?: (criteria: TaskFilterCriteria) => Promise<Readonly<{ items: readonly TaskRecordDTO[]; total: number }>>;
  complete?: (taskId: string) => Promise<TaskRecordDTO | null>;
  update: (taskId: string, input: TaskInput) => Promise<TaskRecordDTO | null>;
}>;
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"] & {
  task_meetings?: { meeting_id: string; meetings: { title: string } | null }[];
};
const select = "id, title, description, assignee_id, due_date, status, source_meeting_id, source_decision_id, source_discussion_point_id, event_id, created_by, created_at, updated_at, task_meetings(meeting_id, meetings(title))";
function fail(error: { code?: string; message: string }): never { throw new TaskRepositoryError(error.code, error.message); }
function map(row: TaskRow): TaskRecordDTO { return { assigneeId: row.assignee_id, createdAt: row.created_at, createdBy: row.created_by, description: row.description, dueDate: row.due_date, eventId: row.event_id, id: row.id, meetingIds: (row.task_meetings ?? []).map(link => link.meeting_id), relatedMeetings: (row.task_meetings ?? []).map(link => ({ id: link.meeting_id, title: link.meetings?.title ?? "Unavailable meeting" })).sort((a,b) => a.title.localeCompare(b.title)), sourceDecisionId: row.source_decision_id, sourceDiscussionPointId: row.source_discussion_point_id, sourceMeetingId: row.source_meeting_id, status: row.status, title: row.title, updatedAt: row.updated_at }; }
function payload(input: TaskInput) { return { assignee_id: input.assigneeId, description: input.description, due_date: input.dueDate, event_id: input.eventId ?? null, source_decision_id: input.sourceDecisionId ?? null, source_discussion_point_id: input.sourceDiscussionPointId ?? null, source_meeting_id: input.sourceMeetingId ?? null, status: input.status, title: input.title }; }
function escapePostgrestPattern(value: string) { return value.replace(/[\\%_]/g, "\\$&").replace(/[(),.]/g, " "); }
export function createTaskRepository(getClient: () => Promise<SupabaseClient<Database>> = createServerSupabaseClient): TaskRepository {
  async function saveWithMeetings(input: TaskInput, taskId?: string): Promise<TaskRecordDTO | null> {
    const client = await getClient();
    const result = await client.rpc("save_task_with_meetings", {
      task_values: payload(input), related_meeting_ids: [...(input.meetingIds ?? [])],
      ...(taskId ? { target_task_id: taskId } : {}),
    });
    if (result.error) fail(result.error);
    if (!result.data) return null;
    const saved = await client.from("tasks").select(select).eq("id", result.data).single();
    if (saved.error) fail(saved.error);
    return map(saved.data as TaskRow);
  }
  return {
    async complete(taskId) {
      const result = await (await getClient()).from("tasks").update({ status: "completed" }).eq("id", taskId).select(select).maybeSingle();
      if (result.error) fail(result.error);
      return result.data ? map(result.data as TaskRow) : null;
    },
    async create(actorId, input) {
      if (input.meetingIds !== undefined) {
        const saved = await saveWithMeetings(input);
        if (!saved) throw new TaskRepositoryError(undefined);
        return saved;
      }
      const client = await getClient();
      const result = await client.from("tasks").insert({ ...payload(input), created_by: actorId }).select(select).single();
      if (result.error) fail(result.error);
      // PostgREST's insert projection cannot see associations added by an AFTER trigger.
      if (result.data.source_meeting_id) {
        const saved = await client.from("tasks").select(select).eq("id", result.data.id).single();
        if (saved.error) fail(saved.error);
        return map(saved.data as TaskRow);
      }
      return map(result.data as TaskRow);
    },
    async delete(taskId) { const result = await (await getClient()).rpc("delete_task_record", { target_task_id: taskId }); if (result.error) fail(result.error); return result.data === "deleted" ? "deleted" : "not_found"; },
    async get(taskId) { const result = await (await getClient()).from("tasks").select(select).eq("id", taskId).maybeSingle(); if (result.error) fail(result.error); return result.data ? map(result.data as TaskRow) : null; },
    async list() { const result = await (await getClient()).from("tasks").select(select).order("due_date").order("id"); if (result.error) fail(result.error); return (result.data ?? []).map((row) => map(row as TaskRow)); },
    async query(criteria) {
      let query = (await getClient()).from("tasks").select(select, { count: "exact" });
      if (criteria.assigneeId) query = query.eq("assignee_id", criteria.assigneeId);
      if (criteria.status !== "all") query = query.eq("status", criteria.status);
      if (criteria.dueFrom) query = query.gte("due_date", criteria.dueFrom);
      if (criteria.dueTo) query = query.lte("due_date", criteria.dueTo);
      if (criteria.eventId) query = query.eq("event_id", criteria.eventId);
      if (criteria.search) { const pattern = `%${escapePostgrestPattern(criteria.search)}%`; query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`); }
      const ascending = criteria.sort === "due_soonest";
      const sortColumn = criteria.sort === "updated_recent" ? "updated_at" : "due_date";
      const start = (criteria.page - 1) * criteria.pageSize;
      const result = await query.order(sortColumn, { ascending }).order("id").range(start, start + criteria.pageSize - 1);
      if (result.error) fail(result.error);
      return { items: (result.data ?? []).map((row) => map(row as TaskRow)), total: result.count ?? 0 };
    },
    async update(taskId, input) {
      if (input.meetingIds !== undefined) return saveWithMeetings(input, taskId);
      const mutable = { assignee_id: input.assigneeId, description: input.description, due_date: input.dueDate, event_id: input.eventId ?? null, status: input.status, title: input.title };
      const result = await (await getClient()).from("tasks").update(mutable).eq("id", taskId).select(select).maybeSingle();
      if (result.error) fail(result.error);
      return result.data ? map(result.data as TaskRow) : null;
    },
  };
}
