export type ParticipantIdentityField = "fullName" | "email" | "studentId";

export type ParticipantIdentityInput = Readonly<{
  email: string;
  fullName: string;
  studentId: string | null;
}>;

/**
 * Values at the server boundary remain unknown until the participant validator
 * proves that every accepted field has exactly one textual value.
 */
export type ParticipantIdentityRawInput = Readonly<{
  email: unknown;
  fullName: unknown;
  studentId?: unknown;
}>;

export type ParticipantIdentityFormValues = Readonly<{
  email: string;
  fullName: string;
  studentId: string;
}>;

export type ParticipantIdentityErrorCode =
  | "FULL_NAME_REQUIRED"
  | "FULL_NAME_INVALID_CARDINALITY"
  | "FULL_NAME_TOO_LONG"
  | "EMAIL_REQUIRED"
  | "EMAIL_INVALID_CARDINALITY"
  | "EMAIL_INVALID"
  | "EMAIL_TOO_LONG"
  | "STUDENT_ID_REQUIRED"
  | "STUDENT_ID_INVALID_CARDINALITY"
  | "STUDENT_ID_CONFLICT"
  | "STUDENT_ID_NOT_ALLOWED"
  | "STUDENT_ID_TOO_LONG";

export type ParticipantIdentityFieldError = Readonly<{
  code: ParticipantIdentityErrorCode;
  field: ParticipantIdentityField;
  label: string;
  message: string;
}>;

/** Authorised-only projection; it is not safe for aggregate or public views. */
export type ParticipantIdentityDTO = Readonly<{
  createdAt: string;
  email: string;
  fullName: string;
  id: string;
  studentId: string | null;
  updatedAt: string;
}>;

export type ParticipantIdentityValidationResult =
  | Readonly<{
      errors: readonly [];
      ok: true;
      value: ParticipantIdentityInput;
    }>
  | Readonly<{
      errors: readonly ParticipantIdentityFieldError[];
      ok: false;
    }>;

export type ParticipantIdentityFailure =
  | Readonly<{
      code: "VALIDATION";
      errors: readonly ParticipantIdentityFieldError[];
      ok: false;
    }>
  | Readonly<{
      code:
        | "UNAUTHENTICATED"
        | "PERMISSION_DENIED"
        | "UNAVAILABLE"
        | "SYSTEM_ERROR";
      ok: false;
    }>;

export type ParticipantIdentityResult =
  | ParticipantIdentityFailure
  | Readonly<{
      ok: true;
      outcome: "created" | "matched";
      participant: ParticipantIdentityDTO;
    }>;

export type ParticipantIdentityPort = Readonly<{
  resolveForEvent: (
    eventId: string,
    input: ParticipantIdentityRawInput,
  ) => Promise<ParticipantIdentityResult>;
}>;

/**
 * Narrow contract owned by #26 and implemented by the trusted #17 event read
 * adapter during integration. Browser input never supplies this boolean.
 */
export type TrustedEventRequirementPort = Readonly<{
  getStudentIdRequirement: (
    eventId: string,
  ) => Promise<Readonly<{ eventId: string; requiresStudentId: boolean }> | null>;
}>;
