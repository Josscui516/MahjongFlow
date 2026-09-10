import {
  calendarDateAt,
  parseIsoCalendarDate,
  SYDNEY_TIME_ZONE,
} from "@/lib/dates";

import { TASK_STATUSES } from "../core/contracts";
import type {
  DueRiskInvalidReason,
  DueRiskResult,
  TaskDueRiskInput,
} from "./contracts";

const invalid = (reason: DueRiskInvalidReason): DueRiskResult => ({
  ok: false,
  reason,
  value: "invalid",
});

/**
 * Classifies one task against a caller-owned instant using Sydney calendar days.
 * It does not read the global clock or create a persisted task status.
 */
export function classifyTaskDueRisk(input: TaskDueRiskInput): DueRiskResult {
  if (!(TASK_STATUSES as readonly unknown[]).includes(input.status)) {
    return invalid("INVALID_STATUS");
  }

  const dueDate = parseIsoCalendarDate(input.dueDate);

  if (!dueDate.ok) {
    return invalid("INVALID_DUE_DATE");
  }

  const today = calendarDateAt(input.now, SYDNEY_TIME_ZONE);

  if (!today.ok) {
    return invalid(
      today.reason === "UNSUPPORTED_TIME_ZONE"
        ? "UNSUPPORTED_TIME_ZONE"
        : "INVALID_NOW",
    );
  }

  if (input.status === "completed") {
    return { ok: true, value: "completed" };
  }

  const daysUntilDue = dueDate.value.ordinal - today.value.ordinal;

  if (daysUntilDue < 0) {
    return { ok: true, value: "overdue" };
  }

  if (daysUntilDue <= 7) {
    return { ok: true, value: "dueSoon" };
  }

  return { ok: true, value: "normal" };
}
