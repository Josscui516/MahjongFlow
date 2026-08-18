import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MeetingEditor } from "./MeetingEditor";
import {
  createFixtureMeetingEditorPort,
  type MeetingFixtureStorage,
} from "./fixturePort";
import { FICTIONAL_MEETING } from "./fixtures";
import { MeetingLoadingSkeleton, MeetingStatePanel } from "./MeetingStatePanel";
import {
  createSubmissionFingerprint,
  validateMeetingEditor,
} from "./validation";

function createMemoryStorage(
  records = new Map<string, string>(),
): MeetingFixtureStorage {
  return {
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => {
      records.set(key, value);
    },
  };
}

const presentationPort = createFixtureMeetingEditorPort({
  createId: () => "fixture-created-meeting",
  storage: createMemoryStorage(),
});

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
    const html = renderToStaticMarkup(
      <MeetingEditor mode="create" port={presentationPort} />,
    );

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
      <MeetingEditor
        initialRecord={FICTIONAL_MEETING}
        mode="update"
        port={presentationPort}
      />,
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

describe("meeting editor fixture port", () => {
  it("keeps a created meeting available to a fresh port after refresh", async () => {
    const records = new Map<string, string>();
    const storage = createMemoryStorage(records);
    const createPort = createFixtureMeetingEditorPort({
      createId: () => "fixture-created-meeting",
      storage,
    });
    const created = await createPort.createMeeting({
      attendeeIds: FICTIONAL_MEETING.attendeeIds,
      decisions: FICTIONAL_MEETING.decisions,
      discussionPoints: FICTIONAL_MEETING.discussionPoints,
      startsAt: FICTIONAL_MEETING.startsAt,
      summary: FICTIONAL_MEETING.summary,
      title: "Created fixture meeting",
    });

    expect(created.ok).toBe(true);

    const refreshedPort = createFixtureMeetingEditorPort({
      createId: () => "unused-id",
      storage,
    });
    const reloaded = await refreshedPort.getMeeting("fixture-created-meeting");

    expect(reloaded).toEqual(created);
  });
});
