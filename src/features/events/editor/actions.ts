"use server";
import type { EventInput, EventMutationResult } from "../core/contracts";
import { createEvent, updateEvent } from "../core/service";
export async function createEventAction(input: EventInput): Promise<EventMutationResult> { return createEvent(input); }
export async function updateEventAction(id: string, input: EventInput): Promise<EventMutationResult> { return updateEvent(id, input); }
