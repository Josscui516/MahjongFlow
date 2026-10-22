import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckInForm, CheckInConfirmation, checkInMessages } from "./CheckInForm";

describe("self check-in form", () => {
  it("collects registration details and explains staff confirmation of attendance", () => {
    const html = renderToStaticMarkup(<CheckInForm studentIdRequired={false} token={"a".repeat(64)} />);
    expect(html).toContain('name="email"');
    expect(html).not.toContain('name="studentId"');
    expect(html).not.toContain("student ID");
    expect(html).toContain('inputMode="email"');
    expect(html).toContain("If you registered before, use the same email.");
    expect(html).not.toContain('name="eventId"');
    expect(html).not.toContain("participantId");
    expect(html).toContain("No account needed");
    expect(html).toContain('name="fullName"');
    expect(html).toContain("Enter your name and email");
    expect(html).toContain("Event staff will confirm your attendance");
    expect(html).not.toContain("register and confirm attendance");
    expect(html).toContain("Confirm registration");
    expect(checkInMessages.success).toContain("You're registered");
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

it.each(["success","already_processed"] as const)("shows %s as a terminal result without a resubmission form", outcome => {
  const html=renderToStaticMarkup(<CheckInConfirmation outcome={outcome}/>);
  expect(html).toContain('role="status"');
  expect(html).toContain("You can close this page");
  expect(html).toContain("Please ask event staff to confirm your attendance");
  expect(html).not.toContain("<form");
  expect(html).not.toContain("<button");
  expect(html).toContain('aria-hidden="true"');
  expect(html).not.toContain("Dinner eligibility");
  if(outcome === "already_processed") {
    expect(html).toContain("Already registered");
    expect(html).toContain("No need to submit again");
    expect(html).toContain("Contact event staff");
  } else {
    expect(html).toContain("Registration confirmed");
    expect(html).toContain("Enjoy the event!");
  }
});
