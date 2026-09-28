"use server";

import { revalidatePath } from "next/cache";

import type { CheckInWindowInput } from "./contracts";
import { checkInTokenService } from "./service";

export async function configureCheckInWindowAction(eventId: string, input: CheckInWindowInput) {
  const result = await checkInTokenService.configureWindow(eventId, input);
  if (result.ok) revalidatePath(`/events/${eventId}`);
  return result;
}

export async function rotateCheckInTokenAction(eventId: string) {
  const result = await checkInTokenService.rotate(eventId);
  if (result.ok) revalidatePath(`/events/${eventId}`);
  return result;
}

export async function revokeCheckInTokenAction(eventId: string) {
  const result = await checkInTokenService.revoke(eventId);
  if (result.ok) revalidatePath(`/events/${eventId}`);
  return result;
}
