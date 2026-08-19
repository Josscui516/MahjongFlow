import "server-only";

import { AuthorizationError, requireBackendUser } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import type {
  AgendaDraft,
  AgendaItemDTO,
  MeetingAgendaDTO,
  MeetingAgendaStore,
} from "./contracts";
import { AgendaPersistenceError } from "./service";

type AgendaRow = Readonly<{
  id: string;
  content: string;
  position: number;
}>;

function mapRows(rows: readonly AgendaRow[] | null): readonly AgendaItemDTO[] {
  return (rows ?? []).map(({ id, content, position }) => ({
    id,
    content,
    position,
  }));
}

function mapDatabaseError(error: { code?: string } | null): AgendaPersistenceError {
  if (error?.code === "42501") {
    return new AgendaPersistenceError("forbidden", "Access denied.");
  }
  if (error?.code === "P0002" || error?.code === "23503") {
    return new AgendaPersistenceError("unavailable", "Meeting unavailable.");
  }
  if (error?.code === "23505" || error?.code === "23514") {
    return new AgendaPersistenceError(
      "conflict",
      "The agenda changed or contains invalid items. Refresh and try again.",
    );
  }
  return new AgendaPersistenceError(
    "system",
    "Unable to save the meeting agenda. Please try again.",
  );
}

export function createMeetingAgendaStore(): MeetingAgendaStore {
  return {
    async read(meetingId): Promise<MeetingAgendaDTO | null> {
      try {
        await requireBackendUser();
      } catch (error) {
        if (error instanceof AuthorizationError) {
          throw new AgendaPersistenceError(
            error.code === "UNAUTHENTICATED" ? "unavailable" : "forbidden",
            error.code === "UNAUTHENTICATED"
              ? "Meeting unavailable."
              : "Access denied.",
          );
        }
        throw error;
      }

      const supabase = await createServerSupabaseClient();
      const [meeting, discussionPoints, decisions] = await Promise.all([
        supabase.from("meetings").select("id").eq("id", meetingId).maybeSingle(),
        supabase
          .from("discussion_points")
          .select("id, content, position")
          .eq("meeting_id", meetingId)
          .order("position")
          .order("id"),
        supabase
          .from("meeting_decisions")
          .select("id, content, position")
          .eq("meeting_id", meetingId)
          .order("position")
          .order("id"),
      ]);

      if (meeting.error || discussionPoints.error || decisions.error) {
        throw mapDatabaseError(
          meeting.error ?? discussionPoints.error ?? decisions.error,
        );
      }
      if (!meeting.data) {
        return null;
      }

      return {
        meetingId,
        discussionPoints: mapRows(discussionPoints.data),
        decisions: mapRows(decisions.data),
      };
    },

    async replaceAtomically(meetingId: string, draft: AgendaDraft) {
      try {
        await requireBackendUser();
      } catch (error) {
        if (error instanceof AuthorizationError) {
          throw new AgendaPersistenceError(
            error.code === "UNAUTHENTICATED" ? "unavailable" : "forbidden",
            error.code === "UNAUTHENTICATED"
              ? "Meeting unavailable."
              : "Access denied.",
          );
        }
        throw error;
      }

      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.rpc("save_meeting_agenda", {
        target_meeting_id: meetingId,
        discussion_items: draft.discussionPoints.map((item) => ({
          id: item.id ?? null,
          content: item.content,
        })),
        decision_items: draft.decisions.map((item) => ({
          id: item.id ?? null,
          content: item.content,
        })),
      });

      if (error) {
        throw mapDatabaseError(error);
      }
    },
  };
}
