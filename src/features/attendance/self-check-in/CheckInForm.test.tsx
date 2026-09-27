import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckInForm, checkInMessages } from "./CheckInForm";

describe("self check-in form", () => {
  it("collects only email when the event does not require a student ID", () => {
    const html = renderToStaticMarkup(<CheckInForm studentIdRequired={false} token={"a".repeat(64)} />);
    expect(html).toContain('name="email"');
    expect(html).not.toContain('name="studentId"');
    expect(html).not.toContain('name="eventId"');
    expect(html).not.toContain("participantId");
  });

  it("requires the conditional student ID and exposes safe outcome messages", () => {
    const html = renderToStaticMarkup(<CheckInForm studentIdRequired token={"a".repeat(64)} />);
    expect(html).toContain('name="studentId"');
    expect(html).toContain("required");
    expect(checkInMessages.unable_to_process).not.toContain("exists");
    expect(checkInMessages.already_processed).not.toContain("confirmed");
    expect(checkInMessages.already_processed).not.toContain("voided");
  });
});
