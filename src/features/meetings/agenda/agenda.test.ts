import { describe, expect, it, vi } from "vitest";

import {
  saveMeetingAgenda,
  sortAgendaItems,
  toAgendaSources,
  validateAgendaDraft,
} from "./index";
import type { MeetingAgendaStore } from "./contracts";

const meetingId = "00000000-0000-4000-8000-000000000013";

describe("meeting agenda", () => {
  it("normalizes content and reports blank items before persistence", () => {
    const result = validateAgendaDraft({
      discussionPoints: [
        { content: "  Venue options  " },
        { content: "  " },
      ],
      decisions: [{ content: "Book the east hall" }],
    });

    expect(result.draft.discussionPoints).toEqual([
      { content: "Venue options" },
      { content: "" },
    ]);
    expect(result.errors).toEqual([
      {
        section: "discussionPoints",
        index: 1,
        message: "Item cannot be blank.",
      },
    ]);
  });

  it("sorts positions deterministically and exposes read-only source DTOs", () => {
    const items = [
      { id: "b", content: "Second", position: 1 },
      { id: "a", content: "First", position: 0 },
    ];

    expect(sortAgendaItems(items).map((item) => item.content)).toEqual([
      "First",
      "Second",
    ]);
    expect(
      toAgendaSources({ meetingId, discussionPoints: items, decisions: [] }),
    ).toEqual([
      { id: "a", meetingId, kind: "discussion", content: "First", position: 0 },
      { id: "b", meetingId, kind: "discussion", content: "Second", position: 1 },
    ]);
  });

  it("does not call persistence when any child item is invalid", async () => {
    const store: MeetingAgendaStore = {
      read: vi.fn(),
      replaceAtomically: vi.fn(),
    };

    const result = await saveMeetingAgenda(
      meetingId,
      {
        discussionPoints: [{ content: "Valid" }, { content: "" }],
        decisions: [{ content: "Decision" }],
      },
      store,
    );

    expect(result.ok).toBe(false);
    expect(store.replaceAtomically).not.toHaveBeenCalled();
  });

  it("saves two ordered discussion points and decisions for M-03", async () => {
    let persisted = {
      meetingId,
      discussionPoints: [] as Array<{ id: string; content: string; position: number }>,
      decisions: [] as Array<{ id: string; content: string; position: number }>,
    };
    const store: MeetingAgendaStore = {
      async read() {
        return persisted;
      },
      async replaceAtomically(targetMeetingId, draft) {
        persisted = {
          meetingId: targetMeetingId,
          discussionPoints: draft.discussionPoints.map((item, position) => ({
            id: `discussion-${position}`,
            content: item.content,
            position,
          })),
          decisions: draft.decisions.map((item, position) => ({
            id: `decision-${position}`,
            content: item.content,
            position,
          })),
        };
      },
    };

    const result = await saveMeetingAgenda(
      meetingId,
      {
        discussionPoints: [
          { content: "Venue" },
          { content: "Equipment" },
        ],
        decisions: [
          { content: "Book the east hall" },
          { content: "Use blue tables" },
        ],
      },
      store,
    );

    expect(result).toMatchObject({
      ok: true,
      agenda: {
        meetingId,
        discussionPoints: [{ position: 0 }, { position: 1 }],
        decisions: [{ position: 0 }, { position: 1 }],
      },
    });
  });
});
