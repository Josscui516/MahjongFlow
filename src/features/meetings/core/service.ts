import "server-only";
import { validateMeetingInput, type MeetingInput } from "@/features/meetings/schemas";
import { AuthorizationError, requireBackendUser, type AccessContext } from "@/lib/auth/authorization";
import type { MeetingEditorPort, MeetingHistoryResult, MeetingMutationResult, MeetingReadResult } from "./contracts";
import { createMeetingRepository, MeetingRepositoryError, type MeetingRepository } from "./repository";

type Dependencies = Readonly<{ authorise: () => Promise<AccessContext>; repository: MeetingRepository }>;
function mapFailure(error: unknown): "PERMISSION_DENIED" | "SYSTEM_ERROR" {
  return error instanceof AuthorizationError || (error instanceof MeetingRepositoryError && ["42501", "PGRST301"].includes(error.code ?? "")) ? "PERMISSION_DENIED" : "SYSTEM_ERROR";
}
export function createMeetingService({ authorise, repository }: Dependencies): MeetingEditorPort & Readonly<{ listMeetingHistory: () => Promise<MeetingHistoryResult> }> {
  async function check(input: MeetingInput) {
    const validation = validateMeetingInput(input);
    if (!validation.ok) return validation;
    return { context: await authorise(), ok: true as const, value: validation.value };
  }
  return {
    async createMeeting(input): Promise<MeetingMutationResult> {
      try { const checked = await check(input); if (!checked.ok) return { code: "VALIDATION", errors: checked.errors, ok: false };
        return { ok: true, record: await repository.create(checked.context.userId, checked.value) }; }
      catch (error) { return { code: mapFailure(error), ok: false }; }
    },
    async getMeeting(meetingId): Promise<MeetingReadResult> {
      try { await authorise(); const record = await repository.get(meetingId); return record ? { ok: true, record } : { code: "NOT_FOUND", ok: false }; }
      catch (error) { return { code: mapFailure(error), ok: false }; }
    },
    async listMeetingHistory(): Promise<MeetingHistoryResult> {
      try { await authorise(); return { items: await repository.listHistory(), ok: true }; }
      catch (error) { return { code: mapFailure(error), ok: false }; }
    },
    async updateMeeting(meetingId, input): Promise<MeetingMutationResult> {
      try { const checked = await check(input); if (!checked.ok) return { code: "VALIDATION", errors: checked.errors, ok: false };
        const record = await repository.update(meetingId, checked.value); return record ? { ok: true, record } : { code: "NOT_FOUND", ok: false }; }
      catch (error) { return { code: mapFailure(error), ok: false }; }
    },
  };
}
const service = createMeetingService({ authorise: requireBackendUser, repository: createMeetingRepository() });
export const createMeeting = service.createMeeting;
export const getMeeting = service.getMeeting;
export const listMeetingHistory = service.listMeetingHistory;
export const updateMeeting = service.updateMeeting;
