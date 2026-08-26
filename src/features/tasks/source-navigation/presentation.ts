import type { SourceKindView } from "./contracts";

export function getMeetingHref(meetingId: string) {
  return `/meetings/${encodeURIComponent(meetingId)}`;
}

export function getTaskHref(taskId: string) {
  return `/tasks/${encodeURIComponent(taskId)}`;
}

export function getSourceKindLabel(sourceKind: SourceKindView) {
  return sourceKind === "decision" ? "Decision source" : "Discussion point source";
}
