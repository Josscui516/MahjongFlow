import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { MeetingAgendaSection } from "./MeetingAgendaSection";

describe("MeetingAgendaSection", () => {
  it("renders ordered editable sections without task or persisted delete controls", () => {
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
    expect(markup).toContain("Remove before save");
    expect(markup).not.toContain("Create task");
    expect(markup).not.toContain("Delete meeting");
  });
});
