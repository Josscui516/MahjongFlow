/** The minimum current attendance fact needed by DIN-C01/02. */
export type DinnerAttendanceFact = Readonly<{
  eventId: string;
  participantId: string;
  attendanceStatus: "confirmed" | "voided";
}>;

export type DinnerEligibility = "Eligible" | "Not Eligible Yet";

/**
 * Derives eligibility for one participant at one event, without storing it.
 * The caller must supply the current unique fact from the authorised read port.
 * A failed read must remain an error at that boundary, not become missing attendance.
 */
export function calculateDinnerEligibility(
  eventId: string,
  participantId: string,
  attendance: DinnerAttendanceFact | null | undefined,
): DinnerEligibility {
  return eventId.trim().length > 0 &&
    participantId.trim().length > 0 &&
    attendance?.eventId === eventId &&
    attendance.participantId === participantId &&
    attendance.attendanceStatus === "confirmed"
    ? "Eligible"
    : "Not Eligible Yet";
}
