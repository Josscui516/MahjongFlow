"use server";

import { revalidatePath } from "next/cache";
import type { ManualAttendanceState } from "./contracts";
import { manualAttendanceService } from "./service";

export async function submitManualAttendance(
  eventId: string,
  _previous: ManualAttendanceState,
  formData: FormData,
): Promise<ManualAttendanceState> {
  const result = await manualAttendanceService.submit(eventId, formData);
  if (result.status === "success") {
    try {
      revalidatePath(`/attendance/${result.eventId}`);
      revalidatePath(`/events/${result.eventId}`);
    } catch {
      // A failed cache refresh must never disguise an already committed write.
      return { ...result, refreshRequired: true };
    }
  }
  return result;
}
