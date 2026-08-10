import { describe, expect, test } from "vitest";

import { AUTH_ERROR_CODES } from "@/lib/auth/contracts";
import { mapPasswordSignInError } from "@/lib/auth/credentials";

describe("mapPasswordSignInError", () => {
  test.each([
    { code: "invalid_credentials", status: 400 },
    { code: "user_not_found", status: 404 },
  ])("uses one non-enumerating credential error", (error) => {
    expect(mapPasswordSignInError(error)).toBe(
      AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    );
  });

  test.each([
    { name: "AuthRetryableFetchError", status: 0 },
    { name: "AuthUnknownError" },
    { code: "request_timeout", status: 504 },
    { code: "over_request_rate_limit", status: 429 },
  ])("separates provider failures from credential rejection", (error) => {
    expect(mapPasswordSignInError(error)).toBe(
      AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
    );
  });
});
