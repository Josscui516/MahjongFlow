import "server-only";

import { AuthorizationError, requireBackendUser } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import type {
  TaskConversionPort,
  TaskSourceContext,
  TaskSourceKind,
  TaskSourceReader,
} from "./contracts";

type DatabaseError = Readonly<{ code?: string }>;

function safeFailure(error: unknown, source?: TaskSourceContext) {
  if (error instanceof AuthorizationError) {
    return {
      ok: false as const,
      code: error.code === "UNAUTHENTICATED" ? "source_missing" as const : "forbidden" as const,
      message: error.code === "UNAUTHENTICATED" ? "The meeting source is unavailable." : "Access denied.",
      source,
    };
  }

  const code = (error as DatabaseError | null)?.code;
  if (code === "23505") {
    return { ok: false as const, code: "duplicate" as const, message: "A task already exists for this source.", source };
  }
  if (code === "42501") {
    return { ok: false as const, code: "forbidden" as const, message: "Access denied.", source };
  }
  if (code === "23503" || code === "23514") {
    return { ok: false as const, code: "source_missing" as const, message: "The meeting source is unavailable.", source };
  }
  return { ok: false as const, code: "system" as const, message: "Unable to create the task. Please try again.", source };
}

function sourceTable(sourceKind: TaskSourceKind) {
  return sourceKind === "decision" ? "meeting_decisions" as const : "discussion_points" as const;
}

export function createTaskSourceReader(): TaskSourceReader {
  return {
    async read(sourceKind, sourceId) {
      await requireBackendUser();
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from(sourceTable(sourceKind))
        .select("id, meeting_id, content")
        .eq("id", sourceId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return {
        meetingId: data.meeting_id,
        sourceContent: data.content,
        sourceId: data.id,
        sourceKind,
      };
    },
  };
}

export function createTaskConversionPort(): TaskConversionPort {
  return {
    async createFromSource(source, input) {
      try {
        const actor = await requireBackendUser();
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            assignee_id: input.assigneeId,
            created_by: actor.userId,
            description: input.description,
            due_date: input.dueDate,
            source_decision_id: source.sourceKind === "decision" ? source.sourceId : null,
            source_discussion_point_id: source.sourceKind === "discussion" ? source.sourceId : null,
            source_meeting_id: source.meetingId,
            status: input.status,
            title: input.title,
          })
          .select("id")
          .single();

        if (error) return safeFailure(error, source);
        return { ok: true, taskId: data.id, source };
      } catch (error) {
        return safeFailure(error, source);
      }
    },
  };
}
