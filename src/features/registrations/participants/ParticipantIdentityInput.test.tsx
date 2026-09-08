import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ParticipantIdentityInput,
  type ParticipantIdentityInputProps,
} from "./ParticipantIdentityInput";
import {
  PARTICIPANT_EMAIL_MAX_LENGTH,
  PARTICIPANT_FULL_NAME_MAX_LENGTH,
  PARTICIPANT_STUDENT_ID_MAX_LENGTH,
} from "./validation";

const DEFAULT_VALUES = {
  email: "fictional.member@example.test",
  fullName: "Fictional Member",
  studentId: "TEST-0001",
} as const;

function renderInput(
  overrides: Partial<ParticipantIdentityInputProps> = {},
): string {
  return renderToStaticMarkup(
    <ParticipantIdentityInput
      defaultValues={DEFAULT_VALUES}
      requiresStudentId={false}
      {...overrides}
    />,
  );
}

function inputNames(html: string): string[] {
  return [...html.matchAll(/<input\b[^>]*\bname="([^"]+)"/g)].map(
    (match) => match[1],
  );
}

describe("ParticipantIdentityInput", () => {
  it("renders only the minimum identity fields for an ordinary event", () => {
    const html = renderInput({ idPrefix: "participant-identity" });

    expect(inputNames(html)).toEqual(["fullName", "email"]);
    expect(html).toContain('id="participant-identity-fullName"');
    expect(html).toContain('id="participant-identity-email"');
    expect(html).toContain('autoComplete="name"');
    expect(html).toContain('autoComplete="email"');
    expect(html).toContain(
      `maxLength="${PARTICIPANT_FULL_NAME_MAX_LENGTH}"`,
    );
    expect(html).toContain(`maxLength="${PARTICIPANT_EMAIL_MAX_LENGTH}"`);
    expect(html).toContain('type="email"');
    expect(html).not.toContain('name="studentId"');
    expect(html).not.toMatch(
      /name="(?:phone|birthDate|address|payment|emergencyContact)"/,
    );
    expect(html).not.toContain("marketing");
  });

  it("adds a required bounded student ID only for an event that needs it", () => {
    const html = renderInput({
      idPrefix: "participant-identity",
      requiresStudentId: true,
    });

    expect(inputNames(html)).toEqual(["fullName", "email", "studentId"]);
    expect(html).toMatch(
      new RegExp(
        `<input(?=[^>]*id="participant-identity-studentId")(?=[^>]*name="studentId")(?=[^>]*maxLength="${PARTICIPANT_STUDENT_ID_MAX_LENGTH}")(?=[^>]*required="")(?=[^>]*value="TEST-0001")[^>]*>`,
      ),
    );
    expect(html).toContain(
      "Required only because this event needs Monash/MSA identity or funding evidence.",
    );
  });

  it("generates unique default field IDs for multiple instances", () => {
    const html = renderToStaticMarkup(
      <>
        <ParticipantIdentityInput
          defaultValues={DEFAULT_VALUES}
          requiresStudentId={false}
        />
        <ParticipantIdentityInput
          defaultValues={DEFAULT_VALUES}
          requiresStudentId={false}
        />
      </>,
    );
    const fullNameIds = [
      ...html.matchAll(/<input\b[^>]*\bid="([^"]+-fullName)"/g),
    ].map((match) => match[1]);

    expect(fullNameIds).toHaveLength(2);
    expect(new Set(fullNameIds).size).toBe(2);
  });

  it("links ordered validation feedback to fields and preserves safe values", () => {
    const html = renderInput({
      fieldErrors: {
        email: ["Enter a valid email address."],
        fullName: ["Enter a full name."],
        studentId: ["This hidden error must not be rendered."],
      },
      idPrefix: "registration-participant",
      status: "validation",
    });

    expect(html).toContain('role="alert"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('href="#registration-participant-fullName"');
    expect(html).toContain('href="#registration-participant-email"');
    expect(html).not.toContain("This hidden error must not be rendered.");
    expect(html.indexOf("Full name: Enter a full name.")).toBeLessThan(
      html.indexOf("Email address: Enter a valid email address."),
    );
    expect(html).toMatch(
      /<input(?=[^>]*id="registration-participant-email")(?=[^>]*aria-errormessage="registration-participant-email-error")(?=[^>]*aria-invalid="true")(?=[^>]*value="fictional.member@example.test")[^>]*>/,
    );
  });

  it("disables every identity control while pending for duplicate-submit protection", () => {
    const html = renderInput({ requiresStudentId: true, status: "pending" });
    const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(
      (match) => match[0],
    );

    expect(html).toContain('data-participant-identity-status="pending"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Participant details are being checked.");
    expect(inputs).toHaveLength(3);
    expect(inputs.every((input) => input.includes('disabled=""'))).toBe(true);
  });

  it.each([
    ["permission", "Access required", "do not have permission"],
    ["system-error", "Something went wrong", "could not be processed"],
    ["success", "Participant ready", "ready for registration"],
    ["matched", "Participant matched", "existing participant record"],
  ] as const)(
    "renders a safe %s state without participant identifiers",
    (status, title, description) => {
      const html = renderInput({ status });

      expect(html).toContain(title);
      expect(html).toContain(description);
      expect(html).not.toContain("participantId");
      expect(html).not.toMatch(
        /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
      );
    },
  );

  it("honours an explicit disabled handoff independently of status", () => {
    const html = renderInput({ disabled: true, status: "idle" });
    const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(
      (match) => match[0],
    );

    expect(html).toContain('data-participant-identity-status="idle"');
    expect(inputs).toHaveLength(2);
    expect(inputs.every((input) => input.includes('disabled=""'))).toBe(true);
  });
});
