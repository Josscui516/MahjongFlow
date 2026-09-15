"use server";

import { revalidatePath } from "next/cache";
import type { RegistrationCreateInput, RegistrationMutationResult, RegistrationUpdateInput } from "./contracts";
import { registrationService } from "./service";

function refresh(result: RegistrationMutationResult): RegistrationMutationResult {
  if (result.ok) {
    // A refresh failure must not report a successful persisted write as a failed write.
    try {
      revalidatePath(`/registrations/${result.eventId}`);
      revalidatePath(`/events/${result.eventId}`);
    } catch {
      return { ...result, refreshRequired: true };
    }
  }
  return result;
}
export async function registerParticipant(input: RegistrationCreateInput): Promise<RegistrationMutationResult> {
  return refresh(await registrationService.register(input));
}
export async function changeRegistrationStatus(input: RegistrationUpdateInput): Promise<RegistrationMutationResult> {
  return refresh(await registrationService.changeStatus(input));
}

/** Search text travels in the POST body, never a URL or persisted preference. */
export async function searchRegistrations(eventId: string, page: number, search: string) {
  return registrationService.list(eventId, page, search);
}
