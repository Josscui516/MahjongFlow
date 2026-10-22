import { calendarDateAt, SYDNEY_TIME_ZONE } from "@/lib/dates";
import type { TaskConversionFormValues } from "./contracts";
import { TASK_TITLE_MAX_LENGTH } from "./validation";

export function taskConversionDefaults(agenda: string, now: Date, userId: string, assignees: readonly { id: string }[]): TaskConversionFormValues {
  const today = calendarDateAt(now, SYDNEY_TIME_ZONE);
  return {
    title: agenda.trim().split(/\s+/u).slice(0, 2).join(" ").slice(0, TASK_TITLE_MAX_LENGTH),
    assigneeId: assignees.some(assignee => assignee.id === userId) ? userId : "",
    dueDate: today.ok ? today.value.isoDate : "",
    status: "not_started",
    description: agenda,
  };
}
