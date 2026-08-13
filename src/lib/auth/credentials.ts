import {
  AUTH_ERROR_CODES,
  type LoginErrorCode,
} from "@/lib/auth/contracts";

export type LoginCredentials = Readonly<{
  email: string;
  password: string;
}>;

type PasswordSignInError = Readonly<{
  code?: string;
  name?: string;
  status?: number;
}>;

const SERVICE_ERROR_CODES = [
  "hook_timeout",
  "hook_timeout_after_retry",
  "over_request_rate_limit",
  "request_timeout",
  "unexpected_failure",
] as const;

const SERVICE_ERROR_NAMES = [
  "AuthRetryableFetchError",
  "AuthUnknownError",
] as const;

export function parseLoginCredentials(
  emailValue: FormDataEntryValue | null,
  passwordValue: FormDataEntryValue | null,
): LoginCredentials | null {
  if (typeof emailValue !== "string" || typeof passwordValue !== "string") {
    return null;
  }

  const email = emailValue.trim();

  if (
    email.length === 0 ||
    email.length > 254 ||
    passwordValue.length === 0 ||
    passwordValue.length > 1_024
  ) {
    return null;
  }

  return { email, password: passwordValue };
}

export function mapPasswordSignInError(
  error: PasswordSignInError,
): LoginErrorCode {
  if (
    error.status === 0 ||
    error.status === 429 ||
    (error.status !== undefined && error.status >= 500) ||
    (error.name !== undefined &&
      SERVICE_ERROR_NAMES.some((name) => name === error.name)) ||
    (error.code !== undefined &&
      SERVICE_ERROR_CODES.some((code) => code === error.code))
  ) {
    return AUTH_ERROR_CODES.SERVICE_UNAVAILABLE;
  }

  return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
}
