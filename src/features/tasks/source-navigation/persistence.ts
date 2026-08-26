import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";

import type {
  RelatedTaskSummary,
  SourceKindView,
  SourceTraceabilityView,
} from "./contracts";

export class SourceNavigationRepositoryError extends Error {
  constructor(readonly code: string | undefined) {
    super("Source navigation persistence failed");
    this.name = "SourceNavigationRepositoryError";
  }
}

export type SourceNavigationRepository = Readonly<{
  listRelatedTasks(meetingId: string): Promise<readonly RelatedTaskSummary[]>;
  readSource(
    meetingId: string,
    sourceKind: SourceKindView,
    sourceId: string,
  ): Promise<SourceTraceabilityView | null>;
}>;

function fail(code: string | undefined): never {
  throw new SourceNavigationRepositoryError(code);
}

export function createSourceNavigationRepository(
  getClient: () => Promise<SupabaseClient<Database>> = createServerSupabaseClient,
): SourceNavigationRepository {
  return {
    async listRelatedTasks(meetingId) {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, source_decision_id, source_discussion_point_id")
        .eq("source_meeting_id", meetingId)
        .order("title")
        .order("id");

      if (error) fail(error.code);

      return (data ?? []).flatMap((task) => {
        const sourceKind = task.source_decision_id
          ? "decision"
          : task.source_discussion_point_id
            ? "discussion"
            : null;

        return sourceKind
          ? [{ id: task.id, sourceKind, title: task.title }]
          : [];
      });
    },

    async readSource(meetingId, sourceKind, sourceId) {
      const supabase = await getClient();
      const sourceTable = sourceKind === "decision" ? "meeting_decisions" : "discussion_points";
      const [meetingResult, sourceResult] = await Promise.all([
        supabase.from("meetings").select("id, title").eq("id", meetingId).maybeSingle(),
        supabase
          .from(sourceTable)
          .select("id, meeting_id, content")
          .eq("id", sourceId)
          .maybeSingle(),
      ]);

      if (meetingResult.error) fail(meetingResult.error.code);
      if (sourceResult.error) fail(sourceResult.error.code);
      if (!meetingResult.data || !sourceResult.data) return null;
      if (sourceResult.data.meeting_id !== meetingResult.data.id) return null;

      return {
        meetingId: meetingResult.data.id,
        meetingTitle: meetingResult.data.title,
        sourceContent: sourceResult.data.content,
        sourceKind,
      };
    },
  };
}
