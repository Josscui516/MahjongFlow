export type AttendanceChecklistRow = Readonly<{
  id: string;
  name: string;
  email: string;
  attendance: Readonly<{ id: string; status: "confirmed" | "voided"; updatedAt: string }> | null;
}>;
