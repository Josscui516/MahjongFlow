"use server";
import { revalidatePath } from "next/cache";
function refreshViews() { revalidatePath("/tasks", "layout"); revalidatePath("/events", "layout"); revalidatePath("/dashboard"); }
import type { EventInput, EventMutationResult } from "../core/contracts";
import { deleteEvent } from "../core/delete";
import { createEvent, updateEvent } from "../core/service";
export async function createEventAction(input: EventInput): Promise<EventMutationResult> { const result = await createEvent(input); if (result.ok) refreshViews(); return result; }
export async function updateEventAction(id: string, input: EventInput): Promise<EventMutationResult> { const result = await updateEvent(id, input); if (result.ok) refreshViews(); return result; }

export async function deleteEventAction(id: string) { const result = await deleteEvent(id); if (result.ok) refreshViews(); return result; }
