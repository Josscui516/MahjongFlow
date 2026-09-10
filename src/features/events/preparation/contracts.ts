import type { TaskRecordDTO } from "@/features/tasks/core/contracts";

export type EventPreparationProgress = Readonly<{ completed: number; total: number }>;
export type EventPreparationSnapshot = Readonly<{
  eventId: string;
  progress: EventPreparationProgress;
  tasks: readonly TaskRecordDTO[];
}>;
export type EventPreparationResult =
  | Readonly<{ ok: true; snapshot: EventPreparationSnapshot }>
  | Readonly<{ code: "NOT_FOUND" | "PERMISSION_DENIED" | "SYSTEM_ERROR"; ok: false }>;
export type TaskEventLinkResult =
  | Readonly<{ ok: true; task: TaskRecordDTO }>
  | Readonly<{ code: "NOT_FOUND" | "PERMISSION_DENIED" | "SYSTEM_ERROR" | "VALIDATION"; ok: false }>;
