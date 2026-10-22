"use server";
import { revalidatePath } from "next/cache";
import { recordDinnerIssued } from "./issuance";
export async function setDinnerIssued(eventId: string, participantId: string, issued: boolean, expectedIssued: boolean) {
  const result = await recordDinnerIssued(eventId, participantId, issued, expectedIssued);
  if (result.ok) revalidatePath(`/events/${eventId}`);
  return result;
}
