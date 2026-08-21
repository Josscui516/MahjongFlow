import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  createAgendaFingerprint,
  MeetingAgendaSection,
  moveAgendaItem,
} from "./MeetingAgendaSection";

describe("MeetingAgendaSection", () => {
  it("renders ordered editable sections with explicit save and reorder controls", () => {
    const markup = renderToStaticMarkup(
      <MeetingAgendaSection
        agenda={{
          meetingId: "meeting-13",
          discussionPoints: [
            { id: "discussion-1", content: "Venue", position: 0 },
          ],
          decisions: [
            { id: "decision-1", content: "Book hall", position: 0 },
          ],
        }}
        onSave={vi.fn()}
      />,
    );

    expect(markup).toContain("Discussion points 1");
    expect(markup).toContain("Key decisions 1");
    expect(markup).toContain("Remove item");
    expect(markup).toContain("Move down");
    expect(markup).toContain("Saved");
    expect(markup).toContain("Save agenda");
    expect(markup).toContain('disabled=""');
    expect(markup).not.toContain("Create task");
    expect(markup).not.toContain("Delete meeting");
  });

  it("explains both empty agenda sections", () => {
    const markup = renderToStaticMarkup(
      <MeetingAgendaSection
        agenda={{ meetingId: "meeting-13", discussionPoints: [], decisions: [] }}
        onSave={vi.fn()}
      />,
    );

    expect(markup).toContain("Capture topics, questions, or updates");
    expect(markup).toContain("Add first discussion point");
    expect(markup).toContain("Record agreed outcomes");
    expect(markup).toContain("Add first key decision");
  });

  it("reorders one section without mutating the other", () => {
    const draft = {
      decisions: [{ content: "Keep this decision", id: "decision-1" }],
      discussionPoints: [
        { content: "First", id: "discussion-1" },
        { content: "Second", id: "discussion-2" },
      ],
    };

    const reordered = moveAgendaItem(draft, "discussionPoints", 0, 1);

    expect(reordered.discussionPoints.map((item) => item.content)).toEqual(["Second", "First"]);
    expect(reordered.decisions).toBe(draft.decisions);
    expect(draft.discussionPoints[0]?.content).toBe("First");
  });

  it("uses content and ordering to detect unsaved changes", () => {
    const first = {
      decisions: [],
      discussionPoints: [
        { content: "Venue", id: "discussion-1" },
        { content: "Budget", id: "discussion-2" },
      ],
    };
    const second = moveAgendaItem(first, "discussionPoints", 0, 1);

    expect(createAgendaFingerprint(first)).not.toBe(createAgendaFingerprint(second));
  });
});
