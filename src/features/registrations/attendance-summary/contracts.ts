import type { RegistrationFailure } from "../records/contracts";

/** Safe aggregate only: no participant identifiers, identities or consent data. */
export type ParticipationSummaryResult = RegistrationFailure | Readonly<{
  ok: true;
  registrationCount: number;
  confirmedAttendanceCount: number;
}>;
