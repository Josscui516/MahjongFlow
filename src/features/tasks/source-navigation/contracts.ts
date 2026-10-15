import type {TaskStatus} from "../core/contracts";

export type SourceKindView = "decision" | "discussion";

export type RelatedTaskSummary = Readonly<{
  id: string;
  sourceKind: SourceKindView | null;
  sourceId?: string;
  status?: TaskStatus;
  title: string;
}>;

export type SourceTraceabilityView = Readonly<{
  meetingId: string;
  meetingTitle: string;
  sourceContent: string;
  sourceKind: SourceKindView;
}>;

export type TaskSourceReference = Readonly<{
  sourceDecisionId?: string | null;
  sourceDiscussionPointId?: string | null;
  sourceMeetingId?: string | null;
}>;

type SafeReadFailure = Readonly<{
  code: "SYSTEM_ERROR" | "UNAVAILABLE";
  ok: false;
}>;

export type RelatedTasksResult =
  | Readonly<{ items: readonly RelatedTaskSummary[]; ok: true }>
  | SafeReadFailure;

export type SourceTraceabilityResult =
  | Readonly<{ ok: true; source: SourceTraceabilityView | null }>
  | SafeReadFailure;

/**
 * Server-side adapter boundary for #25. Implementations must collapse missing
 * and forbidden resources to UNAVAILABLE before returning to the panels.
 */
export type SourceNavigationReader = Readonly<{
  listRelatedTasks(meetingId: string): Promise<RelatedTasksResult>;
  readTaskSource(task: TaskSourceReference): Promise<SourceTraceabilityResult>;
}>;
