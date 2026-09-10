import type {
  ParticipantIdentityDTO,
  ParticipantIdentityRawInput,
} from "./contracts";

export const FICTIONAL_STANDARD_EVENT_REQUIREMENT = {
  eventId: "26000000-0000-4000-8000-000000000001",
  requiresStudentId: false,
} as const;

export const FICTIONAL_STUDENT_EVENT_REQUIREMENT = {
  eventId: "26000000-0000-4000-8000-000000000002",
  requiresStudentId: true,
} as const;

export const FICTIONAL_PARTICIPANT_RAW_INPUT: ParticipantIdentityRawInput = {
  email: "  CASEY.RIVER@EXAMPLE.TEST ",
  fullName: "  Casey   River  ",
  studentId: " TEST-2601 ",
};

export const FICTIONAL_PARTICIPANT: ParticipantIdentityDTO = {
  createdAt: "2026-09-08T00:00:00.000Z",
  email: "casey.river@example.test",
  fullName: "Casey River",
  id: "26100000-0000-4000-8000-000000000001",
  studentId: "TEST-2601",
  updatedAt: "2026-09-08T00:00:00.000Z",
};
