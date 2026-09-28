export type ManualAttendanceField =
  | "eventId" | "operation" | "email" | "recordId"
  | "expectedUpdatedAt" | "targetStatus" | "confirmation";

export type ManualAttendanceFieldError = Readonly<{
  field: ManualAttendanceField;
  message: string;
}>;

export type ManualAttendanceState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "success"; eventId: string; updatedAt: string; refreshRequired?: boolean }>
  | Readonly<{ status: "validation"; errors: readonly ManualAttendanceFieldError[] }>
  | Readonly<{ status: "permission-denied" | "unauthenticated" | "unavailable" | "duplicate" | "conflict" | "system-error" }>;

export type ManualAttendanceAction = (
  previous: ManualAttendanceState,
  formData: FormData,
) => Promise<ManualAttendanceState>;

export type ManualAttendanceCommand = Readonly<{ eventId: string }> & (
  | Readonly<{ operation: "create"; email: string }>
  | Readonly<{
      operation: "correct";
      recordId: string;
      expectedUpdatedAt: string;
      targetStatus: "confirmed" | "voided";
    }>
);

export type ManualAttendancePort = Readonly<{
  submit: (eventId: string, formData: FormData) => Promise<ManualAttendanceState>;
}>;
