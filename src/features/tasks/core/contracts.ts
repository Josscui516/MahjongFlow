export const TASK_STATUSES = ["not_started", "in_progress", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type TaskInput = Readonly<{
  assigneeId: string;
  description: string;
  dueDate: string;
  eventId?: string | null;
  sourceDecisionId?: string | null;
  sourceDiscussionPointId?: string | null;
  sourceMeetingId?: string | null;
  status: TaskStatus;
  title: string;
}>;

export type TaskRecordDTO = Readonly<TaskInput & {
  createdAt: string;
  createdBy: string;
  id: string;
  updatedAt: string;
}>;

export type TaskValidationError = Readonly<{ field: keyof TaskInput; message: string }>;
export type TaskMutationResult =
  | Readonly<{ ok: true; record: TaskRecordDTO }>
  | Readonly<{ code: "NOT_FOUND" | "PERMISSION_DENIED" | "SYSTEM_ERROR" | "VALIDATION"; errors?: readonly TaskValidationError[]; ok: false }>;
export type TaskReadResult =
  | Readonly<{ ok: true; record: TaskRecordDTO }>
  | Readonly<{ code: "NOT_FOUND" | "PERMISSION_DENIED" | "SYSTEM_ERROR"; ok: false }>;
export type TaskListResult =
  | Readonly<{ items: readonly TaskRecordDTO[]; ok: true; total: number }>
  | Readonly<{ code: "PERMISSION_DENIED" | "SYSTEM_ERROR"; ok: false }>;
export type TaskDeleteResult =
  | Readonly<{ ok: true }>
  | Readonly<{ code: "NOT_FOUND" | "PERMISSION_DENIED" | "SYSTEM_ERROR"; ok: false }>;
export type TaskEditorPort = Readonly<{
  createTask: (input: TaskInput) => Promise<TaskMutationResult>;
  getTask: (taskId: string) => Promise<TaskReadResult>;
  updateTask: (taskId: string, input: TaskInput) => Promise<TaskMutationResult>;
}>;
