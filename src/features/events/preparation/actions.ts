"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setTaskEvent } from "./service";

export async function setTaskEventAction(formData: FormData) {
  const taskId = formData.get("taskId");
  const rawEventId = formData.get("eventId");
  if (typeof taskId !== "string" || typeof rawEventId !== "string") return;
  const result = await setTaskEvent(taskId, rawEventId || null);
  if (result.ok) { revalidatePath("/events", "layout"); revalidatePath("/tasks", "layout"); revalidatePath("/dashboard"); }
  const origin = formData.get("originEventId");
  if (typeof origin === "string" && /^[0-9a-f-]{36}$/i.test(origin)) redirect(`/events/${origin}?preparation=${result.ok ? "saved" : "error"}`);
}
