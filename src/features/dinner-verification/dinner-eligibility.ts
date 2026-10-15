/** The current administrator-maintained membership for one activity. */
export type DinnerRosterFact = Readonly<{
  eventId: string;
  participantId: string;
  rosterStatus: "listed" | "removed";
}>;

export type DinnerEligibility = "Eligible" | "Not Eligible Yet";

/**
 * Derives eligibility for one participant at one event, without storing it.
 * The caller must supply the current unique fact from the authorised read port.
 * A failed read must remain an error, not become missing roster membership.
 */
export function calculateDinnerEligibility(
  eventId: string,
  participantId: string,
  roster: DinnerRosterFact | null | undefined,
): DinnerEligibility {
  return eventId.trim().length > 0 &&
    participantId.trim().length > 0 &&
    roster?.eventId === eventId &&
    roster.participantId === participantId &&
    roster.rosterStatus === "listed"
    ? "Eligible"
    : "Not Eligible Yet";
}
