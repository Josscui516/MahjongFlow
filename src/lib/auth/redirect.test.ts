import { describe, expect, test } from "vitest";

import { getSafeBackofficeRedirectPath } from "@/lib/auth/redirect";

describe("getSafeBackofficeRedirectPath", () => {
  test.each([
    ["/backoffice", "/backoffice"],
    [
      "/backoffice/meetings?filter=mine#current",
      "/backoffice/meetings?filter=mine#current",
    ],
  ])("allows a back-office path", (value, expected) => {
    expect(getSafeBackofficeRedirectPath(value)).toBe(expected);
  });

  test.each([
    "https://malicious.example/backoffice",
    "//malicious.example/backoffice",
    "/\\malicious.example/backoffice",
    "/login",
    "backoffice",
    null,
  ])("rejects an unsafe redirect value", (value) => {
    expect(getSafeBackofficeRedirectPath(value)).toBe("/backoffice");
  });
});
