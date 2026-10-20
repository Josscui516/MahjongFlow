"use server";

import { readDinnerVerification } from "./server";
import { saveDinnerRosterEntry, removeDinnerRosterEntry } from "./roster";
import { revalidatePath } from "next/cache";

export async function addDinnerRosterEntry(fullName: string, email: string) {
  const result = await saveDinnerRosterEntry(fullName, email);
  if (result.ok) revalidatePath("/dinner-roster");
  return result;
}

export async function removeDinnerRosterMember(entryId: string) {
  const result = await removeDinnerRosterEntry(entryId);
  if (result.ok) revalidatePath("/dinner-roster");
  return result;
}

// Refresh requires the same authorisation and roster RLS checks as a page read.
export async function refreshDinnerVerification(eventId: string) {
  return readDinnerVerification(eventId);
}
