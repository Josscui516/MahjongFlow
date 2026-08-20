import type {
  AgendaDraft,
  AgendaSaveResult,
  MeetingAgendaDTO,
  MeetingAgendaStore,
} from "./contracts";
import { sortAgendaItems, validateAgendaDraft } from "./agenda";

export async function getMeetingAgenda(
  meetingId: string,
  store: MeetingAgendaStore,
): Promise<MeetingAgendaDTO | null> {
  const agenda = await store.read(meetingId);

  if (!agenda) {
    return null;
  }

  return {
    ...agenda,
    discussionPoints: sortAgendaItems(agenda.discussionPoints),
    decisions: sortAgendaItems(agenda.decisions),
  };
}

export async function saveMeetingAgenda(
  meetingId: string,
  input: AgendaDraft,
  store: MeetingAgendaStore,
): Promise<AgendaSaveResult> {
  const validated = validateAgendaDraft(input);

  if (validated.errors.length > 0) {
    return { ok: false, code: "validation", fieldErrors: validated.errors };
  }

  try {
    await store.replaceAtomically(meetingId, validated.draft);
    const agenda = await getMeetingAgenda(meetingId, store);

    if (!agenda) {
      return {
        ok: false,
        code: "unavailable",
        message: "Meeting unavailable.",
      };
    }

    return { ok: true, agenda };
  } catch (error) {
    if (error instanceof AgendaPersistenceError) {
      return { ok: false, code: error.code, message: error.message };
    }

    return {
      ok: false,
      code: "system",
      message: "Unable to save the meeting agenda. Please try again.",
    };
  }
}

export class AgendaPersistenceError extends Error {
  constructor(
    readonly code: "forbidden" | "unavailable" | "conflict" | "system",
    message: string,
  ) {
    super(message);
    this.name = "AgendaPersistenceError";
  }
}
