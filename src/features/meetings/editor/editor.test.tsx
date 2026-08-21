import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { MeetingEditorPort, MeetingRecordDTO } from "./contracts";
import { MeetingEditor } from "./MeetingEditor";
import { MeetingLoadingSkeleton, MeetingStatePanel } from "./MeetingStatePanel";
import {
  createSubmissionFingerprint,
  formatSydneyDateTimeDisplay,
  formatSydneyDateTimeInput,
  validateMeetingEditor,
} from "./validation";
import { MEETING_SUMMARY_MAX_LENGTH, MEETING_TITLE_MAX_LENGTH } from "../schemas";

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
    expect(formatSydneyDateTimeDisplay("2026-08-18T08:30:00.000Z")).toContain("18 Aug 2026");
    expect(formatSydneyDateTimeDisplay("2026-08-18T08:30:00.000Z")).toContain("6:30 pm");
  });

  it("rejects values beyond the shared meeting character limits", () => {
    const errors = validateMeetingEditor({
      attendeeIds: [ATTENDEE_ID],
      startsAt: "2026-08-18T18:30",
      summary: "S".repeat(MEETING_SUMMARY_MAX_LENGTH + 1),
      title: "T".repeat(MEETING_TITLE_MAX_LENGTH + 1),
    });

    expect(errors).toEqual([
      { field: "title", label: "Meeting title", message: "Use no more than 200 characters." },
      { field: "summary", label: "Summary", message: "Use no more than 10,000 characters." },
    ]);
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
    expect(html).toContain("Meeting creation progress");
    expect(html).toContain("Create and add agenda");
    expect(html).toContain('maxLength="200"');
    expect(html).toContain('maxLength="10000"');
    expect(html).toContain("AEST or AEDT is applied automatically");
  });

  it("blocks creation and explains recovery when no committee profiles exist", () => {
    const html = renderToStaticMarkup(<MeetingEditor attendeeOptions={[]} mode="create" port={PORT} />);

    expect(html).toContain("Ask an administrator to add a profile");
    expect(html).toContain('disabled=""');
  });

  it("renders a readable detail view without future-work implementation notes", () => {
    const html = renderToStaticMarkup(<MeetingEditor agendaSlot={<section>Meeting agenda</section>} attendeeOptions={OPTIONS} initialRecord={MEETING} justCreated mode="update" port={PORT} />);
    expect(html).toContain("Weekly committee meeting");
    expect(html).toContain("Meeting agenda");
    expect(html).toContain("Meeting created");
    expect(html).toContain("1 participant");
    expect(html).toContain("Alex Example");
    expect(html).toContain("Summary");
    expect(html).not.toContain("Future extension");
    expect(html).not.toContain("Issue #56");
    expect(html).not.toContain("Create task");
  });

  it("uses text and ARIA semantics for loading and denied states", () => {
    const html = renderToStaticMarkup(<><MeetingStatePanel description="Safe denial copy." state="permission" title="Access required" /><MeetingLoadingSkeleton /></>);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Access required");
    expect(html).toContain('aria-hidden="true"');
  });
});
