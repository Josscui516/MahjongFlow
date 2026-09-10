import "server-only";
import { getEvent } from "@/features/events/core/service";
import { createAuthorisedParticipantIdentityPort } from "@/features/registrations/participants/server";
import { readParticipantIdentityFormData } from "@/features/registrations/participants";
import { registerParticipant } from "./actions";

const participants = createAuthorisedParticipantIdentityPort({
  async getStudentIdRequirement(eventId) {
    const result = await getEvent(eventId);
    if (!result.ok) {
      if (result.code === "NOT_FOUND") return null;
      throw new Error("Event requirements unavailable");
    }
    return { eventId, requiresStudentId: result.record.requiresStudentId };
  },
});

export async function registerIdentity(eventId: string, form: FormData) {
  const identity = await participants.resolveForEvent(eventId, readParticipantIdentityFormData(form));
  if (!identity.ok) return { ...identity, fieldErrors: identity.code === "VALIDATION" ? identity.errors : [] };
  // Only the server-resolved participant ID crosses the registration boundary.
  return { ...await registerParticipant({ eventId, participantId: identity.participant.id }), fieldErrors: [] };
}
