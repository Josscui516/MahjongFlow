"use server";

import { readDinnerVerification } from "./server";
import { saveDinnerRosterEntry, removeDinnerRosterEntry } from "./roster";
import { revalidatePath } from "next/cache";

export async function addDinnerRosterEntry(eventId: string, fullName: string, email: string) {
  const result = await saveDinnerRosterEntry(eventId, fullName, email);
  if (result.ok) revalidatePath(`/dinner-verification/${eventId}`);
  return result;
}

export async function removeDinnerRosterMember(eventId: string, entryId: string) {
  const result = await removeDinnerRosterEntry(eventId, entryId);
  if (result.ok) revalidatePath(`/dinner-verification/${eventId}`);
  return result;
}

// Refresh requires the same authorisation and roster RLS checks as a page read.
export async function refreshDinnerVerification(eventId: string) {
  return readDinnerVerification(eventId);
}
