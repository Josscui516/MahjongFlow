import type {
  ParticipantIdentityErrorCode,
  ParticipantIdentityField,
  ParticipantIdentityFieldError,
  ParticipantIdentityRawInput,
  ParticipantIdentityValidationResult,
} from "./contracts";

export const PARTICIPANT_FULL_NAME_MAX_LENGTH = 120;
export const PARTICIPANT_EMAIL_MAX_LENGTH = 254;
export const PARTICIPANT_STUDENT_ID_MAX_LENGTH = 32;

const EMAIL_FORMAT = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u;

const FIELD_LABELS: Readonly<Record<ParticipantIdentityField, string>> = {
  email: "Email",
  fullName: "Full name",
  studentId: "Student ID",
};

function error(
  field: ParticipantIdentityField,
  code: ParticipantIdentityErrorCode,
  message: string,
): ParticipantIdentityFieldError {
  return { code, field, label: FIELD_LABELS[field], message };
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

function isRepeatedOrNonText(value: unknown): boolean {
  return value !== undefined && value !== null && typeof value !== "string";
}

export function normaliseParticipantFullName(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

export function normaliseParticipantEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normaliseParticipantStudentId(value: string): string | null {
  const normalised = value.trim();
  return normalised || null;
}

export function readParticipantIdentityFormData(
  formData: FormData,
): ParticipantIdentityRawInput {
  function read(field: ParticipantIdentityField): unknown {
    const values = formData.getAll(field);
    if (values.length === 0) return undefined;
    return values.length === 1 ? values[0] : values;
  }

  return {
    email: read("email"),
    fullName: read("fullName"),
    studentId: read("studentId"),
  };
}

export function participantIdentityFormValues(
  input: ParticipantIdentityRawInput,
): Readonly<{ email: string; fullName: string; studentId: string }> {
  return {
    email: typeof input.email === "string" ? input.email : "",
    fullName: typeof input.fullName === "string" ? input.fullName : "",
    studentId: typeof input.studentId === "string" ? input.studentId : "",
  };
}

export function validateParticipantIdentity(
  input: ParticipantIdentityRawInput,
  options: Readonly<{ requiresStudentId: boolean }>,
): ParticipantIdentityValidationResult {
  const errors: ParticipantIdentityFieldError[] = [];

  let fullName = "";
  if (isRepeatedOrNonText(input.fullName)) {
    errors.push(
      error(
        "fullName",
        "FULL_NAME_INVALID_CARDINALITY",
        "Enter one participant name.",
      ),
    );
  } else {
    fullName = normaliseParticipantFullName(
      typeof input.fullName === "string" ? input.fullName : "",
    );
    if (!fullName) {
      errors.push(
        error("fullName", "FULL_NAME_REQUIRED", "Enter the participant's name."),
      );
    } else if (characterLength(fullName) > PARTICIPANT_FULL_NAME_MAX_LENGTH) {
      errors.push(
        error(
          "fullName",
          "FULL_NAME_TOO_LONG",
          `Use no more than ${PARTICIPANT_FULL_NAME_MAX_LENGTH} characters.`,
        ),
      );
    }
  }

  let email = "";
  if (isRepeatedOrNonText(input.email)) {
    errors.push(
      error(
        "email",
        "EMAIL_INVALID_CARDINALITY",
        "Enter one email address.",
      ),
    );
  } else {
    email = normaliseParticipantEmail(
      typeof input.email === "string" ? input.email : "",
    );
    if (!email) {
      errors.push(error("email", "EMAIL_REQUIRED", "Enter an email address."));
    } else if (characterLength(email) > PARTICIPANT_EMAIL_MAX_LENGTH) {
      errors.push(
        error(
          "email",
          "EMAIL_TOO_LONG",
          `Use no more than ${PARTICIPANT_EMAIL_MAX_LENGTH} characters.`,
        ),
      );
    } else if (!EMAIL_FORMAT.test(email)) {
      errors.push(
        error("email", "EMAIL_INVALID", "Enter a valid email address."),
      );
    }
  }

  let studentId: string | null = null;
  if (isRepeatedOrNonText(input.studentId)) {
    errors.push(
      error(
        "studentId",
        "STUDENT_ID_INVALID_CARDINALITY",
        "Enter one student ID.",
      ),
    );
  } else {
    studentId = normaliseParticipantStudentId(
      typeof input.studentId === "string" ? input.studentId : "",
    );
    if (options.requiresStudentId && !studentId) {
      errors.push(
        error(
          "studentId",
          "STUDENT_ID_REQUIRED",
          "Enter a student ID for this event.",
        ),
      );
    } else if (!options.requiresStudentId && studentId) {
      errors.push(
        error(
          "studentId",
          "STUDENT_ID_NOT_ALLOWED",
          "This event does not require a student ID.",
        ),
      );
    } else if (
      studentId &&
      characterLength(studentId) > PARTICIPANT_STUDENT_ID_MAX_LENGTH
    ) {
      errors.push(
        error(
          "studentId",
          "STUDENT_ID_TOO_LONG",
          `Use no more than ${PARTICIPANT_STUDENT_ID_MAX_LENGTH} characters.`,
        ),
      );
    }
  }

  if (errors.length > 0) return { errors, ok: false };

  return {
    errors: [],
    ok: true,
    value: { email, fullName, studentId },
  };
}
