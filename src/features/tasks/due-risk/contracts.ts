import type { TaskRecordDTO } from "../core/contracts";

export type DueRisk = "overdue" | "dueSoon" | "normal" | "completed";

export type DueRiskInvalidReason =
  | "INVALID_DUE_DATE"
  | "INVALID_NOW"
  | "INVALID_STATUS"
  | "UNSUPPORTED_TIME_ZONE";

export type DueRiskResult =
  | Readonly<{ ok: true; value: DueRisk }>
  | Readonly<{ ok: false; reason: DueRiskInvalidReason; value: "invalid" }>;

export type TaskDueRiskInput = Readonly<
  Pick<TaskRecordDTO, "dueDate" | "status"> & {
    now: Date;
  }
>;
