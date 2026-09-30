"use server";

import { readDinnerVerification } from "./server";

// A direct invocation must pass the same provider authorisation and RLS checks
// as a page request. No eligibility or attendance write takes place here.
export async function refreshDinnerVerification(eventId: string) {
  return readDinnerVerification(eventId);
}
