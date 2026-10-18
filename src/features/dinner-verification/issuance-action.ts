"use server";
import { recordDinnerIssued } from "./issuance";
export async function setDinnerIssued(eventId: string, participantId: string, issued: boolean, expectedIssued: boolean) {
  return recordDinnerIssued(eventId, participantId, issued, expectedIssued);
}
