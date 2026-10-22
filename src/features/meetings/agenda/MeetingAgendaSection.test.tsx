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

    expect(markup).toContain("Agenda item 1");
    expect(markup).toContain("Agenda item 2");
    expect(markup).toContain("Remove agenda item");
    expect(markup).not.toContain("Move down");
    expect(markup).toContain("No changes to save");
    expect(markup).toContain("Done");
    expect(markup).not.toContain('disabled=""');
    expect(markup).not.toContain("Done editing");
    expect(markup).not.toContain("Discard changes");
    expect(markup).not.toContain("/tasks/convert/");
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

    expect(markup).toContain("No agenda items yet");
    expect(markup).toContain("Add agenda");


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

it("opens existing meetings in read mode with explicit editing", () => {
 const html=renderToStaticMarkup(<MeetingAgendaSection startInReadMode agenda={{meetingId:"meeting",discussionPoints:[],decisions:[{id:"decision",content:"Fictional booking",position:0}]}} onSave={vi.fn()}/>);
 expect(html).toContain("Edit agenda");
 expect(html).toContain("Fictional booking");
 expect(html).not.toContain("textarea");
 expect(html).not.toContain("Done");
});

it("offers direct additions for empty sections in read mode", () => {
  const markup = renderToStaticMarkup(<MeetingAgendaSection startInReadMode agenda={{meetingId:"meeting", discussionPoints:[], decisions:[]}} onSave={vi.fn()} />);
  expect(markup).toContain("Add agenda");
  expect(markup).toContain("Add agenda");
  expect(markup).not.toContain("textarea");
});

it("keeps reorder controls for sections with multiple entries", () => {
  const markup = renderToStaticMarkup(<MeetingAgendaSection agenda={{meetingId:"meeting", discussionPoints:[{id:"one",content:"Room",position:0},{id:"two",content:"Equipment",position:1}], decisions:[]}} onSave={vi.fn()} />);
  expect(markup).toContain('aria-label="Move agenda item 2 up"');
  expect(markup).toContain('aria-label="Move agenda item 1 down"');
});

it("numbers read-mode items and preserves each distinct source link", () => {
  const html = renderToStaticMarkup(<MeetingAgendaSection startInReadMode agenda={{meetingId:"meeting",discussionPoints:[{id:"discussion",content:"Room discussion",position:0}],decisions:[{id:"decision",content:"Book the room",position:0}]}} onSave={vi.fn()} />);
  expect(html).toContain('aria-label="Create task from agenda item 1"');
  expect(html).toContain('aria-label="Create task from agenda item 2"');
  expect(html).toContain('href="/tasks/convert/discussion/discussion"');
  expect(html).toContain('href="/tasks/convert/decision/decision"');
});
