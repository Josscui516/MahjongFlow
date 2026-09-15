import type { TaskRecordDTO } from "@/features/tasks/core/contracts";
import type { EventPreparationProgress } from "./contracts";

export function calculateEventPreparationProgress(tasks: readonly Pick<TaskRecordDTO, "status">[]): EventPreparationProgress {
  return { completed: tasks.filter(({ status }) => status === "completed").length, total: tasks.length };
}
