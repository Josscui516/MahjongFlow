import { useId } from "react";

import { FormErrorSummary, FormField } from "@/components/forms";

import type {
  ParticipantIdentityField,
  ParticipantIdentityFormValues,
} from "./contracts";
import {
  PARTICIPANT_EMAIL_MAX_LENGTH,
  PARTICIPANT_FULL_NAME_MAX_LENGTH,
  PARTICIPANT_STUDENT_ID_MAX_LENGTH,
} from "./validation";

export type ParticipantIdentityInputStatus =
  | "idle"
  | "matched"
  | "pending"
  | "permission"
  | "success"
  | "system-error"
  | "validation";

export type ParticipantIdentityFieldErrors = Readonly<
  Partial<Record<ParticipantIdentityField, readonly string[]>>
>;

export type ParticipantIdentityInputProps = Readonly<{
  defaultValues: ParticipantIdentityFormValues;
  disabled?: boolean;
  fieldErrors?: ParticipantIdentityFieldErrors;
  idPrefix?: string;
  requiresStudentId: boolean;
  status?: ParticipantIdentityInputStatus;
}>;

const FIELD_ORDER = ["fullName", "email", "studentId"] as const;

const FIELD_LABELS: Record<ParticipantIdentityField, string> = {
  email: "Email address",
  fullName: "Full name",
  studentId: "Student ID",
};

function fieldError(
  errors: ParticipantIdentityFieldErrors,
  field: ParticipantIdentityField,
): string | undefined {
  const messages = (errors[field] ?? []).filter(
    (message) => message.trim().length > 0,
  );

  return messages.length > 0 ? messages.join(" ") : undefined;
}

function ParticipantIdentityStatus({
  status,
}: Readonly<{ status: ParticipantIdentityInputStatus }>) {
  if (status === "idle" || status === "validation") {
    return null;
  }

  const feedback = {
    matched: {
      description:
        "An existing participant record was matched and is ready for registration.",
      role: "status" as const,
      title: "Participant matched",
    },
    pending: {
      description: "Participant details are being checked.",
      role: "status" as const,
      title: "Checking participant",
    },
    permission: {
      description: "You do not have permission to manage participant details.",
      role: "alert" as const,
      title: "Access required",
    },
    success: {
      description: "Participant details are ready for registration.",
      role: "status" as const,
      title: "Participant ready",
    },
    "system-error": {
      description: "Participant details could not be processed. Try again.",
      role: "alert" as const,
      title: "Something went wrong",
    },
  }[status];

  return (
    <section
      aria-live={feedback.role === "alert" ? "assertive" : "polite"}
      className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-slate-950"
      role={feedback.role}
    >
      <h3 className="font-semibold">{feedback.title}</h3>
      <p className="mt-1 text-sm leading-5">{feedback.description}</p>
    </section>
  );
}

/**
 * Reusable participant fields only. The consuming registration form owns the
 * form action and submit button, and must pass its pending state here and to
 * that button so repeated submissions are disabled consistently.
 */
export function ParticipantIdentityInput({
  defaultValues,
  disabled = false,
  fieldErrors = {},
  idPrefix,
  requiresStudentId,
  status = "idle",
}: ParticipantIdentityInputProps) {
  const generatedId = useId();
  const resolvedIdPrefix = idPrefix ?? `participant-identity-${generatedId}`;
  const isDisabled = disabled || status === "pending";
  const visibleFields = requiresStudentId
    ? FIELD_ORDER
    : FIELD_ORDER.filter((field) => field !== "studentId");
  const errorsByField = Object.fromEntries(
    visibleFields.map((field) => [field, fieldError(fieldErrors, field)]),
  ) as Partial<Record<ParticipantIdentityField, string | undefined>>;
  const summaryErrors = visibleFields.flatMap((field) => {
    const message = errorsByField[field];

    return message
      ? [
          {
            fieldId: `${resolvedIdPrefix}-${field}`,
            label: FIELD_LABELS[field],
            message,
          },
        ]
      : [];
  });

  return (
    <div
      className="space-y-5"
      data-participant-identity-status={status}
    >
      <FormErrorSummary
        errors={summaryErrors}
        title="Check the participant details"
      />
      <ParticipantIdentityStatus status={status} />

      <fieldset
        aria-busy={status === "pending" || undefined}
        className="min-w-0"
        disabled={isDisabled}
      >
        <legend className="sr-only">
          Participant identity
        </legend>
        <p className="mt-1 text-sm leading-5 text-slate-600">
          Use the participant’s name and email for this event.
        </p>

        <div className="mt-4 grid gap-4">
          <FormField
            control={
              <input
                autoComplete="name"
                defaultValue={defaultValues.fullName}
                disabled={isDisabled}
                maxLength={PARTICIPANT_FULL_NAME_MAX_LENGTH}
                name="fullName"
              />
            }

            error={errorsByField.fullName}
            id={`${resolvedIdPrefix}-fullName`}
            label={FIELD_LABELS.fullName}
            required
          />

          <FormField
            control={
              <input
                autoCapitalize="none"
                autoComplete="email"
                defaultValue={defaultValues.email}
                disabled={isDisabled}
                maxLength={PARTICIPANT_EMAIL_MAX_LENGTH}
                name="email"
                spellCheck={false}
                type="email"
              />
            }
            description="Used only to identify the participant and prevent duplicate records."
            error={errorsByField.email}
            id={`${resolvedIdPrefix}-email`}
            label={FIELD_LABELS.email}
            required
          />

          {requiresStudentId ? (
            <FormField
              control={
                <input
                  autoCapitalize="characters"
                  autoComplete="off"
                  defaultValue={defaultValues.studentId}
                  disabled={isDisabled}
                  maxLength={PARTICIPANT_STUDENT_ID_MAX_LENGTH}
                  name="studentId"
                  spellCheck={false}
                />
              }
              description="Required only because this event needs Monash/MSA identity or funding evidence."
              error={errorsByField.studentId}
              id={`${resolvedIdPrefix}-studentId`}
              label={FIELD_LABELS.studentId}
              required
            />
          ) : null}
        </div>
      </fieldset>
    </div>
  );
}
