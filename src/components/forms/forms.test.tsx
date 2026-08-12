import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormErrorSummary } from "./FormErrorSummary";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

describe("FormField", () => {
  it("connects label, description, error, and a preserved input value", () => {
    const html = renderToStaticMarkup(
      <FormField
        control={
          <input
            aria-describedby="email-format"
            className="tracking-wide"
            defaultValue="member@example.test"
            name="email"
            type="email"
          />
        }
        description="Use the address provided to the committee."
        error="Enter a valid email address."
        id="email"
        label="Email"
        required
      />,
    );

    expect(html).toContain('<label class="');
    expect(html).toContain('for="email"');
    expect(html).toContain('id="email-description"');
    expect(html).toContain('id="email-error"');
    expect(html).toContain("(required)");
    expect(html).toContain("tracking-wide");
    expect(html).toMatch(
      /<input(?=[^>]*id="email")(?=[^>]*aria-describedby="email-format email-description email-error")(?=[^>]*aria-errormessage="email-error")(?=[^>]*aria-invalid="true")(?=[^>]*required="")(?=[^>]*value="member@example.test")[^>]*>/,
    );
    expect(html).toContain("Error:");
    expect(html).toContain("Enter a valid email address.");
  });

  it("does not create a dangling error relationship when valid", () => {
    const html = renderToStaticMarkup(
      <FormField
        control={<textarea name="notes" />}
        description="Optional coordination notes."
        id="notes"
        label="Notes"
      />,
    );

    expect(html).toContain('aria-describedby="notes-description"');
    expect(html).not.toContain("notes-error");
    expect(html).not.toContain('aria-invalid="true"');
  });
});

describe("FormErrorSummary", () => {
  it("renders an alert with field links in form order", () => {
    const html = renderToStaticMarkup(
      <FormErrorSummary
        errors={[
          {
            fieldId: "meeting-title",
            label: "Meeting title",
            message: "Enter a title.",
          },
          {
            fieldId: "meeting-date",
            label: "Meeting date",
            message: "Choose a date.",
          },
        ]}
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('href="#meeting-title"');
    expect(html).toContain('href="#meeting-date"');
    expect(html.indexOf("Meeting title")).toBeLessThan(
      html.indexOf("Meeting date"),
    );
  });

  it("renders nothing for an empty error collection", () => {
    expect(renderToStaticMarkup(<FormErrorSummary errors={[]} />)).toBe("");
  });
});

describe("SubmitButton", () => {
  it("is enabled and shows its normal label while idle", () => {
    const html = renderToStaticMarkup(
      <form>
        <SubmitButton pending={false}>Save meeting</SubmitButton>
      </form>,
    );

    expect(html).toContain('type="submit"');
    expect(html).toContain('data-submit-state="idle"');
    expect(html).toContain("Save meeting");
    expect(html).not.toContain(' disabled=""');
    expect(html).not.toContain("aria-busy");
  });

  it("uses native disabled semantics and visible progress copy while pending", () => {
    const html = renderToStaticMarkup(
      <form>
        <SubmitButton pending pendingLabel="Saving meeting…">
          Save meeting
        </SubmitButton>
      </form>,
    );

    expect(html).toContain('type="submit"');
    expect(html).toContain('data-submit-state="pending"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain("Saving meeting…");
    expect(html).not.toContain(">Save meeting</button>");
  });
});
