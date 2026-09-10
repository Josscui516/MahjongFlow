"use server";

import { revalidatePath } from "next/cache";
import { setTaskEvent } from "./service";

export async function setTaskEventAction(formData: FormData) {
  const taskId = formData.get("taskId");
  const rawEventId = formData.get("eventId");
  if (typeof taskId !== "string" || typeof rawEventId !== "string") return;
  const result = await setTaskEvent(taskId, rawEventId || null);
  if (result.ok || result.code === "NOT_FOUND") revalidatePath("/events");
}
