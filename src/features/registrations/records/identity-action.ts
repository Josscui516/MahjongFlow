"use server";
import { registerIdentity } from "./identity-registration";

export async function registerIdentityAction(eventId: string, form: FormData) {
  return registerIdentity(eventId, form);
}
