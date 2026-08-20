export type AgendaItemDTO = Readonly<{
  id: string;
  content: string;
  position: number;
}>;

export type MeetingAgendaDTO = Readonly<{
  meetingId: string;
  discussionPoints: readonly AgendaItemDTO[];
  decisions: readonly AgendaItemDTO[];
}>;

export type AgendaDraftItem = Readonly<{
  id?: string;
  content: string;
}>;

export type AgendaDraft = Readonly<{
  discussionPoints: readonly AgendaDraftItem[];
  decisions: readonly AgendaDraftItem[];
}>;

export type AgendaFieldError = Readonly<{
  section: "discussionPoints" | "decisions";
  index: number;
  message: string;
}>;

export type AgendaSaveResult =
  | Readonly<{ ok: true; agenda: MeetingAgendaDTO }>
  | Readonly<{
      ok: false;
      code: "validation";
      fieldErrors: readonly AgendaFieldError[];
    }>
  | Readonly<{
      ok: false;
      code: "forbidden" | "unavailable" | "conflict" | "system";
      message: string;
    }>;

export type MeetingAgendaSourceDTO = Readonly<{
  id: string;
  meetingId: string;
  kind: "discussion" | "decision";
  content: string;
  position: number;
}>;

export type MeetingAgendaStore = Readonly<{
  read(meetingId: string): Promise<MeetingAgendaDTO | null>;
  replaceAtomically(meetingId: string, draft: AgendaDraft): Promise<void>;
}>;
