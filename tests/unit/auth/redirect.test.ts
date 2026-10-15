import { describe, expect, test } from "vitest";

import { getSafeBackofficeRedirectPath } from "@/lib/auth/redirect";

describe("getSafeBackofficeRedirectPath", () => {
  test("defaults a new login to the unified Dashboard", () => {
    expect(getSafeBackofficeRedirectPath(undefined)).toBe("/dashboard");
  });
  test.each([
    ["/backoffice", "/backoffice"],
    [
      "/backoffice/meetings?filter=mine#current",
      "/backoffice/meetings?filter=mine#current",
    ],
    ["/dashboard?view=mine", "/dashboard?view=mine"],
    ["/meetings/fictional-meeting-id", "/meetings/fictional-meeting-id"],
    ["/tasks/fictional-task-id", "/tasks/fictional-task-id"],
    ["/events/fictional-event-id", "/events/fictional-event-id"],
    ["/registrations", "/registrations"],
    ["/admin/users", "/admin/users"],
    [
      "/attendance/fictional-event-id",
      "/attendance/fictional-event-id",
    ],
    [
      "/dinner-verification/fictional-event-id",
      "/dinner-verification/fictional-event-id",
    ],
  ])("allows a back-office path", (value, expected) => {
    expect(getSafeBackofficeRedirectPath(value)).toBe(expected);
  });

  test.each([
    "https://malicious.example/backoffice",
    "//malicious.example/backoffice",
    "/\\malicious.example/backoffice",
    "/login",
    "/dashboard-public",
    "/meetings-public/fictional-meeting-id",
    "/check-in/fictional-token",
    "backoffice",
    null,
  ])("rejects an unsafe redirect value", (value) => {
    expect(getSafeBackofficeRedirectPath(value)).toBe("/dashboard");
  });
});
