export type RegistrationStatus = "registered" | "cancelled";

/** Minimal authorised UI projection, never a complete participant/database row. */
export type RegistrationItem = Readonly<{
  id: string;
  participantName: string;
  participantEmail: string;
  status: RegistrationStatus;
  updatedAt: string;
  privacyNoticeAcknowledgedAt: string | null;
}>;
export type RegistrationFailureCode =
  | "UNAUTHENTICATED" | "PERMISSION_DENIED" | "VALIDATION"
  | "UNAVAILABLE" | "CONFLICT" | "SYSTEM_ERROR";
export type RegistrationFailure = Readonly<{ ok: false; code: RegistrationFailureCode }>;
export type RegistrationMutationResult = RegistrationFailure | Readonly<{
  ok: true;
  eventId: string;
  outcome: "created" | "duplicate" | "updated" | "unchanged";
  status: RegistrationStatus;
  refreshRequired?: true;
}>;
export type RegistrationListResult = RegistrationFailure | Readonly<{
  ok: true;
  eventId: string;
  items: readonly RegistrationItem[];
  page: number;
  total: number;
}>;
export type RegistrationCountResult = RegistrationFailure | Readonly<{
  ok: true;
  eventId: string;
  registrationCount: number;
}>;
export type RegistrationCreateInput = Readonly<{ eventId: string; participantId: string }>;
export type RegistrationUpdateInput = Readonly<{
  eventId: string;
  registrationId: string;
  status: RegistrationStatus;
  expectedUpdatedAt: string;
}>;
export type RegistrationMutationPort = Readonly<{
  register: (input: RegistrationCreateInput) => Promise<RegistrationMutationResult>;
  changeStatus: (input: RegistrationUpdateInput) => Promise<RegistrationMutationResult>;
}>;

export const REGISTRATION_PAGE_SIZE = 25;
