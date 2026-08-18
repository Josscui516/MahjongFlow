import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MeetingEditor } from "./MeetingEditor";
import { FICTIONAL_MEETING } from "./fixtures";
import { MeetingLoadingSkeleton, MeetingStatePanel } from "./MeetingStatePanel";
import {
  createSubmissionFingerprint,
  validateMeetingEditor,
} from "./validation";

describe("meeting editor validation", () => {
  it("returns field errors in focus order for an empty meeting", () => {
    const errors = validateMeetingEditor({
      attendeeIds: [],
      decisions: "",
      discussionPoints: "",
      startsAt: "",
      summary: "",
      title: "",
    });

    expect(errors.map((error) => error.field)).toEqual([
      "title",
      "startsAt",
      "attendeeIds",
      "discussionPoints",
      "decisions",
      "summary",
    ]);
  });

  it("accepts the complete fictional fixture", () => {
    expect(validateMeetingEditor(FICTIONAL_MEETING)).toEqual([]);
  });

  it("creates the same duplicate fingerprint for reordered attendees", () => {
    const first = createSubmissionFingerprint(FICTIONAL_MEETING);
    const second = createSubmissionFingerprint({
      ...FICTIONAL_MEETING,
      attendeeIds: [...FICTIONAL_MEETING.attendeeIds].reverse(),
    });

    expect(second).toBe(first);
  });
});

describe("meeting editor presentation", () => {
  it("renders create fields in keyboard order with fictional participants", () => {
    const html = renderToStaticMarkup(<MeetingEditor mode="create" />);

    const title = html.indexOf('id="meeting-title"');
    const startsAt = html.indexOf('id="meeting-startsAt"');
    const attendees = html.indexOf('id="meeting-attendeeIds"');
    const discussion = html.indexOf('id="meeting-discussionPoints"');

    expect(title).toBeGreaterThan(-1);
    expect(startsAt).toBeGreaterThan(title);
    expect(attendees).toBeGreaterThan(startsAt);
    expect(discussion).toBeGreaterThan(attendees);
    expect(html).toContain("Alex Example");
    expect(html).not.toContain("delete");
  });

  it("renders a safe detail view with a reserved future area", () => {
    const html = renderToStaticMarkup(
      <MeetingEditor initialRecord={FICTIONAL_MEETING} mode="update" />,
    );

    expect(html).toContain("Weekly committee meeting");
    expect(html).toContain("Decision recorded");
    expect(html).toContain("Future extension");
    expect(html).toContain("intentionally non-interactive");
    expect(html).not.toContain("Create task");
  });

  it("uses text and ARIA semantics for loading and denied states", () => {
    const html = renderToStaticMarkup(
      <>
        <MeetingStatePanel
          description="Safe denial copy."
          state="permission"
          title="Access required"
        />
        <MeetingLoadingSkeleton />
      </>,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Access required");
    expect(html).toContain('aria-hidden="true"');
  });
});
