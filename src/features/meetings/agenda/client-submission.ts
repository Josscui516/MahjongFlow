import type { AgendaDraft, AgendaSaveResult } from "./contracts";

type AgendaSaveAction = (draft: AgendaDraft) => Promise<AgendaSaveResult>;

export async function saveAgendaSafely(
  onSave: AgendaSaveAction,
  draft: AgendaDraft,
): Promise<AgendaSaveResult> {
  try {
    return await onSave(draft);
  } catch {
    return {
      code: "system",
      message: "Unable to save the meeting agenda. Please try again.",
      ok: false,
    };
  }
}
