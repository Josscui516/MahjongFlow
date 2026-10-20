import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckInForm, checkInMessages } from "./CheckInForm";

describe("self check-in form", () => {
  it("collects identity and explains that submission confirms attendance without another staff step", () => {
    const html = renderToStaticMarkup(<CheckInForm studentIdRequired={false} token={"a".repeat(64)} />);
    expect(html).toContain('name="email"');
    expect(html).not.toContain('name="studentId"');
    expect(html).not.toContain('name="eventId"');
    expect(html).not.toContain("participantId");
    expect(html).toContain("You do not need a previous registration");
    expect(html).toContain('name="fullName"');
    expect(html).toContain("No additional staff check-in is required");
    expect(html).toContain("Confirm check-in");
    expect(checkInMessages.success).toContain("Your attendance is confirmed");
  });

  it("requires the conditional student ID and exposes safe outcome messages", () => {
    const html = renderToStaticMarkup(<CheckInForm studentIdRequired token={"a".repeat(64)} />);
    expect(html).toContain('name="studentId"');
    expect(html).toContain("required");
    expect(checkInMessages.unable_to_process).not.toContain("exists");
    expect(checkInMessages.unable_to_process).toContain("contact event staff");
    expect(checkInMessages.already_processed).not.toContain("confirmed");
    expect(checkInMessages.already_processed).not.toContain("voided");
  });
});
