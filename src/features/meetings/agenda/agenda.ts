import type {
  AgendaDraft,
  AgendaDraftItem,
  AgendaFieldError,
  AgendaItemDTO,
  MeetingAgendaDTO,
  MeetingAgendaSourceDTO,
} from "./contracts";

const MAX_ITEM_LENGTH = 5000;

export function sortAgendaItems(
  items: readonly AgendaItemDTO[],
): readonly AgendaItemDTO[] {
  return [...items].sort(
    (left, right) =>
      left.position - right.position || left.id.localeCompare(right.id),
  );
}

export function validateAgendaDraft(draft: AgendaDraft): {
  draft: AgendaDraft;
  errors: readonly AgendaFieldError[];
} {
  const errors: AgendaFieldError[] = [];

  function normalizeSection(
    section: AgendaFieldError["section"],
    values: readonly AgendaDraftItem[],
  ) {
    return values.map((value, index) => {
      const content = value.content.trim();

      if (content.length === 0) {
        errors.push({ section, index, message: "Item cannot be blank." });
      } else if (content.length > MAX_ITEM_LENGTH) {
        errors.push({
          section,
          index,
          message: `Item must be ${MAX_ITEM_LENGTH} characters or fewer.`,
        });
      }

      return { ...value, content };
    });
  }

  return {
    draft: {
      discussionPoints: normalizeSection(
        "discussionPoints",
        draft.discussionPoints,
      ),
      decisions: normalizeSection("decisions", draft.decisions),
    },
    errors,
  };
}

export function toAgendaSources(
  agenda: MeetingAgendaDTO,
): readonly MeetingAgendaSourceDTO[] {
  return [
    ...sortAgendaItems(agenda.discussionPoints).map((item) => ({
      ...item,
      meetingId: agenda.meetingId,
      kind: "discussion" as const,
    })),
    ...sortAgendaItems(agenda.decisions).map((item) => ({
      ...item,
      meetingId: agenda.meetingId,
      kind: "decision" as const,
    })),
  ];
}
