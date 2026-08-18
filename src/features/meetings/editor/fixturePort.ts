import type {
  MeetingEditorPort,
  MeetingEditorResult,
  MeetingEditorValues,
  MeetingRecordDTO,
} from "./contracts";
import { FICTIONAL_MEETING } from "./fixtures";
import { validateMeetingEditor } from "./validation";

const STORAGE_PREFIX = "mahjongflow:meeting-editor-fixture:";

export type MeetingFixtureStorage = Pick<
  Storage,
  "getItem" | "setItem"
>;

type FixturePortDependencies = Readonly<{
  createId: () => string;
  storage: MeetingFixtureStorage;
}>;

function storageKey(meetingId: string) {
  return `${STORAGE_PREFIX}${meetingId}`;
}

function isMeetingRecord(value: unknown): value is MeetingRecordDTO {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.startsAt === "string" &&
    Array.isArray(record.attendeeIds) &&
    record.attendeeIds.every((attendeeId) => typeof attendeeId === "string") &&
    typeof record.discussionPoints === "string" &&
    typeof record.decisions === "string" &&
    typeof record.summary === "string"
  );
}

function readStoredMeeting(
  storage: MeetingFixtureStorage,
  meetingId: string,
): MeetingRecordDTO | null {
  const rawRecord = storage.getItem(storageKey(meetingId));
  if (!rawRecord) return null;

  try {
    const record: unknown = JSON.parse(rawRecord);
    return isMeetingRecord(record) ? record : null;
  } catch {
    return null;
  }
}

function validate(values: MeetingEditorValues): MeetingEditorResult | null {
  const errors = validateMeetingEditor(values);
  return errors.length > 0
    ? { code: "VALIDATION", errors, ok: false }
    : null;
}

export function createFixtureMeetingEditorPort({
  createId,
  storage,
}: FixturePortDependencies): MeetingEditorPort {
  return {
    async createMeeting(values) {
      const invalid = validate(values);
      if (invalid) return invalid;

      try {
        const record = { ...values, id: createId() };
        storage.setItem(storageKey(record.id), JSON.stringify(record));
        return { ok: true, record };
      } catch {
        return { code: "SYSTEM_ERROR", ok: false };
      }
    },

    async getMeeting(meetingId) {
      try {
        const storedMeeting = readStoredMeeting(storage, meetingId);
        if (storedMeeting) return { ok: true, record: storedMeeting };
        if (meetingId === FICTIONAL_MEETING.id) {
          return { ok: true, record: FICTIONAL_MEETING };
        }
        return { code: "NOT_FOUND", ok: false };
      } catch {
        return { code: "SYSTEM_ERROR", ok: false };
      }
    },

    async updateMeeting(meetingId, values) {
      const invalid = validate(values);
      if (invalid) return invalid;

      try {
        const record = { ...values, id: meetingId };
        storage.setItem(storageKey(meetingId), JSON.stringify(record));
        return { ok: true, record };
      } catch {
        return { code: "SYSTEM_ERROR", ok: false };
      }
    },
  };
}

export function createBrowserFixtureMeetingEditorPort(): MeetingEditorPort {
  const createPort = () =>
    createFixtureMeetingEditorPort({
      createId: () => crypto.randomUUID(),
      storage: window.localStorage,
    });

  return {
    async createMeeting(values) {
      try {
        return await createPort().createMeeting(values);
      } catch {
        return { code: "SYSTEM_ERROR", ok: false };
      }
    },
    async getMeeting(meetingId) {
      try {
        return await createPort().getMeeting(meetingId);
      } catch {
        return { code: "SYSTEM_ERROR", ok: false };
      }
    },
    async updateMeeting(meetingId, values) {
      try {
        return await createPort().updateMeeting(meetingId, values);
      } catch {
        return { code: "SYSTEM_ERROR", ok: false };
      }
    },
  };
}
