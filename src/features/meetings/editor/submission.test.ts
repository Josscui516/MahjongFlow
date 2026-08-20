import { describe, expect, it, vi } from "vitest";

import type { MeetingEditorPort, MeetingRecordDTO } from "./contracts";
import { submitMeetingSafely } from "./submission";

const ATTENDEE_ID = "11111111-1111-4111-8111-111111111111";
const VALUES = {
  attendeeIds: [ATTENDEE_ID],
  startsAt: "2026-08-20T18:30",
  summary: "Fictional meeting summary.",
  title: "Fictional meeting",
} as const;
const RECORD: MeetingRecordDTO = {
  ...VALUES,
  createdAt: "2026-08-20T08:30:00.000Z",
  createdBy: ATTENDEE_ID,
  id: "22222222-2222-4222-8222-222222222222",
  startsAt: "2026-08-20T08:30:00.000Z",
  updatedAt: "2026-08-20T08:30:00.000Z",
};

function createPort(overrides: Partial<MeetingEditorPort> = {}): MeetingEditorPort {
  return {
    createMeeting: async () => ({ ok: true, record: RECORD }),
    getMeeting: async () => ({ ok: true, record: RECORD }),
    updateMeeting: async () => ({ ok: true, record: RECORD }),
    ...overrides,
  };
}

describe("meeting editor submission boundary", () => {
  it("maps a rejected create action to a safe system error", async () => {
    const port = createPort({
      createMeeting: vi.fn().mockRejectedValue(new Error("private transport detail")),
    });

    await expect(
      submitMeetingSafely(port, { mode: "create" }, VALUES),
    ).resolves.toEqual({ code: "SYSTEM_ERROR", ok: false });
  });

  it("uses the persisted meeting id for update submissions", async () => {
    const updateMeeting = vi.fn(async () => ({ ok: true as const, record: RECORD }));

    await expect(
      submitMeetingSafely(
        createPort({ updateMeeting }),
        { initialRecord: RECORD, mode: "update" },
        VALUES,
      ),
    ).resolves.toMatchObject({ ok: true });
    expect(updateMeeting).toHaveBeenCalledWith(RECORD.id, VALUES);
  });
});
