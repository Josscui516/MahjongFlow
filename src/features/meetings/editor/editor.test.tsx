import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { MeetingEditorPort, MeetingRecordDTO } from "./contracts";
import { MeetingEditor } from "./MeetingEditor";
import { MeetingLoadingSkeleton, MeetingStatePanel } from "./MeetingStatePanel";
import { createSubmissionFingerprint, formatSydneyDateTimeInput, validateMeetingEditor } from "./validation";

const ATTENDEE_ID = "11111111-1111-4111-8111-111111111111";
const OPTIONS = [{ id: ATTENDEE_ID, label: "Alex Example" }] as const;
const MEETING: MeetingRecordDTO = {
  attendeeIds: [ATTENDEE_ID],
  createdAt: "2026-08-18T08:30:00.000Z",
  createdBy: ATTENDEE_ID,
  id: "22222222-2222-4222-8222-222222222222",
  startsAt: "2026-08-18T08:30:00.000Z",
  summary: "The committee confirmed the next implementation checkpoint.",
  title: "Weekly committee meeting",
  updatedAt: "2026-08-18T08:30:00.000Z",
};
const PORT: MeetingEditorPort = {
  createMeeting: async () => ({ ok: true, record: MEETING }),
  getMeeting: async () => ({ ok: true, record: MEETING }),
  updateMeeting: async () => ({ ok: true, record: MEETING }),
};

describe("meeting editor validation", () => {
  it("returns field errors in focus order for an empty meeting", () => {
    const errors = validateMeetingEditor({ attendeeIds: [], startsAt: "", summary: "", title: "" });
    expect(errors.map((error) => error.field)).toEqual(["title", "startsAt", "attendeeIds", "summary"]);
  });

  it("creates the same duplicate fingerprint for reordered attendees", () => {
    const values = { attendeeIds: [ATTENDEE_ID, MEETING.id], startsAt: "2026-08-18T18:30", summary: MEETING.summary, title: MEETING.title };
    expect(createSubmissionFingerprint({ ...values, attendeeIds: [...values.attendeeIds].reverse() })).toBe(createSubmissionFingerprint(values));
  });

  it("formats persisted timestamps using Sydney wall-clock time", () => {
    expect(formatSydneyDateTimeInput("2026-08-18T08:30:00.000Z")).toBe("2026-08-18T18:30");
  });
});

describe("meeting editor presentation", () => {
  it("renders real committee options in keyboard order", () => {
    const html = renderToStaticMarkup(<MeetingEditor attendeeOptions={OPTIONS} mode="create" port={PORT} />);
    const title = html.indexOf('id="meeting-title"');
    const startsAt = html.indexOf('id="meeting-startsAt"');
    const attendees = html.indexOf('id="meeting-attendeeIds"');
    const summary = html.indexOf('id="meeting-summary"');
    expect(title).toBeGreaterThan(-1);
    expect(startsAt).toBeGreaterThan(title);
    expect(attendees).toBeGreaterThan(startsAt);
    expect(summary).toBeGreaterThan(attendees);
    expect(html).toContain("Alex Example");
  });

  it("renders a safe detail view, agenda slot, and reserved future area", () => {
    const html = renderToStaticMarkup(<MeetingEditor agendaSlot={<section>Meeting agenda</section>} attendeeOptions={OPTIONS} initialRecord={MEETING} mode="update" port={PORT} />);
    expect(html).toContain("Weekly committee meeting");
    expect(html).toContain("Meeting agenda");
    expect(html).toContain("Future extension");
    expect(html).not.toContain("Create task");
  });

  it("uses text and ARIA semantics for loading and denied states", () => {
    const html = renderToStaticMarkup(<><MeetingStatePanel description="Safe denial copy." state="permission" title="Access required" /><MeetingLoadingSkeleton /></>);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Access required");
    expect(html).toContain('aria-hidden="true"');
  });
});
