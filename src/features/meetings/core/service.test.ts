import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { AuthorizationError } from "@/lib/auth/authorization";
import type { MeetingInput, NormalisedMeetingInput } from "../schemas";
import type { MeetingRecordDTO } from "./contracts";
import { MeetingRepositoryError, type MeetingRepository } from "./repository";
import { createMeetingService } from "./service";

const actorId = "11111111-1111-4111-8111-111111111111";
const otherAttendeeId = "22222222-2222-4222-8222-222222222222";
const meetingId = "30000000-0000-4000-8000-000000000012";
const validInput: MeetingInput = {
  attendeeIds: [actorId], startsAt: "2026-08-20T18:30", summary: "Fictional summary.", title: "Fictional meeting",
};
const record: MeetingRecordDTO = {
  attendeeIds: [actorId], createdAt: "2026-08-20T08:00:00.000Z", createdBy: actorId,
  id: meetingId, startsAt: "2026-08-20T08:30:00.000Z", summary: "Fictional summary.",
  title: "Fictional meeting", updatedAt: "2026-08-20T08:00:00.000Z",
};

function repository(overrides: Partial<MeetingRepository> = {}): MeetingRepository {
  return {
    create: vi.fn(async () => record),
    get: vi.fn(async () => record),
    listHistory: vi.fn(async () => [{ id: record.id, startsAt: record.startsAt, summary: record.summary, title: record.title }]),
    update: vi.fn(async () => ({ ...record, attendeeIds: [otherAttendeeId] })),
    ...overrides,
  };
}

describe("meeting core service", () => {
  test("M-01 creates and re-reads a complete meeting through the port", async () => {
    const store = new Map<string, MeetingRecordDTO>();
    const memoryRepository = repository({
      async create(_actorId: string, input: NormalisedMeetingInput) {
        const created = { ...record, ...input };
        store.set(created.id, created);
        return created;
      },
      async get(id) { return store.get(id) ?? null; },
    });
    const service = createMeetingService({ authorise: async () => ({ canManageAccounts: false, role: "committee", userId: actorId }), repository: memoryRepository });
    const created = await service.createMeeting(validInput);
    expect(created).toMatchObject({ ok: true, record: { id: meetingId } });
    expect(await service.getMeeting(meetingId)).toEqual(created);
  });

  test("M-02 rejects invalid input after authorisation but before persistence", async () => {
    const authorise = vi.fn(async () => ({ canManageAccounts: false, role: "committee" as const, userId: actorId }));
    const persistence = repository();
    const service = createMeetingService({ authorise, repository: persistence });
    const result = await service.createMeeting({ ...validInput, title: "" });
    expect(result).toMatchObject({ code: "VALIDATION", ok: false });
    expect(authorise).toHaveBeenCalledOnce();
    expect(persistence.create).not.toHaveBeenCalled();
  });

  test("M-05 denies unauthenticated mutations before returning validation details", async () => {
    const persistence = repository();
    const service = createMeetingService({
      authorise: async () => { throw new AuthorizationError("UNAUTHENTICATED"); },
      repository: persistence,
    });

    await expect(service.createMeeting({ ...validInput, title: "" })).resolves.toEqual({
      code: "PERMISSION_DENIED",
      ok: false,
    });
    expect(persistence.create).not.toHaveBeenCalled();
  });

  test("M-05 maps anonymous access to a stable permission result before reads", async () => {
    const persistence = repository();
    const service = createMeetingService({ authorise: async () => { throw new AuthorizationError("UNAUTHENTICATED"); }, repository: persistence });
    await expect(service.getMeeting(meetingId)).resolves.toEqual({ code: "PERMISSION_DENIED", ok: false });
    expect(persistence.get).not.toHaveBeenCalled();
  });

  test("allows authorised users to update the attendee set", async () => {
    const persistence = repository();
    const service = createMeetingService({ authorise: async () => ({ canManageAccounts: false, role: "authorised", userId: actorId }), repository: persistence });
    const result = await service.updateMeeting(meetingId, { ...validInput, attendeeIds: [otherAttendeeId] });
    expect(result).toMatchObject({ ok: true, record: { attendeeIds: [otherAttendeeId] } });
    expect(persistence.update).toHaveBeenCalledOnce();
  });

  test("returns NOT_FOUND when an update targets a missing meeting", async () => {
    const service = createMeetingService({
      authorise: async () => ({ canManageAccounts: false, role: "committee", userId: actorId }),
      repository: repository({ update: async () => null }),
    });

    await expect(service.updateMeeting(meetingId, validInput)).resolves.toEqual({ code: "NOT_FOUND", ok: false });
  });

  test("rejects malformed meeting identifiers before persistence", async () => {
    const persistence = repository();
    const service = createMeetingService({
      authorise: async () => ({ canManageAccounts: false, role: "committee", userId: actorId }),
      repository: persistence,
    });

    await expect(service.getMeeting("not-a-uuid")).resolves.toEqual({ code: "NOT_FOUND", ok: false });
    await expect(service.getMeeting(` ${meetingId} `)).resolves.toEqual({ code: "NOT_FOUND", ok: false });
    await expect(service.updateMeeting("not-a-uuid", validInput)).resolves.toEqual({ code: "NOT_FOUND", ok: false });
    expect(persistence.get).not.toHaveBeenCalled();
    expect(persistence.update).not.toHaveBeenCalled();
  });

  test("maps a stale attendee selection to a safe field validation error", async () => {
    const service = createMeetingService({
      authorise: async () => ({ canManageAccounts: false, role: "committee", userId: actorId }),
      repository: repository({
        create: async () => { throw new MeetingRepositoryError("23503", "provider detail"); },
      }),
    });

    await expect(service.createMeeting(validInput)).resolves.toEqual({
      code: "VALIDATION",
      errors: [{ field: "attendeeIds", message: "Select attendees who are current committee members." }],
      ok: false,
    });
  });

  test("returns stable history items and hides persistence failures", async () => {
    const service = createMeetingService({ authorise: async () => ({ canManageAccounts: false, role: "committee", userId: actorId }), repository: repository() });
    await expect(service.listMeetingHistory()).resolves.toMatchObject({ ok: true, items: [{ id: meetingId }] });
    const failed = createMeetingService({ authorise: async () => ({ canManageAccounts: false, role: "committee", userId: actorId }), repository: repository({ get: async () => { throw new Error("provider detail"); } }) });
    await expect(failed.getMeeting(meetingId)).resolves.toEqual({ code: "SYSTEM_ERROR", ok: false });
  });
});
