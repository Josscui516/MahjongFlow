import {
  AUTH_ERROR_CODES,
  type AuthenticatedUserResult,
} from "@/lib/auth/contracts";

type AuthUserLookupError = Readonly<{
  code?: string;
  name?: string;
  status?: number;
}>;

export type TrustedUserLookup = () => Promise<
  Readonly<{
    data: Readonly<{
      user: Readonly<{ id: string }> | null;
    }>;
    error: AuthUserLookupError | null;
  }>
>;

const INVALID_SESSION_ERROR_CODES = [
  "bad_jwt",
  "refresh_token_already_used",
  "refresh_token_not_found",
  "session_expired",
  "session_not_found",
  "user_not_found",
] as const;

function isInvalidSessionError(error: AuthUserLookupError) {
  return (
    error.name === "AuthSessionMissingError" ||
    (error.code !== undefined &&
      INVALID_SESSION_ERROR_CODES.some((code) => code === error.code)) ||
    error.status === 401 ||
    error.status === 403
  );
}

export async function resolveAuthenticatedUser(
  lookupUser: TrustedUserLookup,
): Promise<AuthenticatedUserResult> {
  try {
    const { data, error } = await lookupUser();

    if (error) {
      return {
        error: isInvalidSessionError(error)
          ? AUTH_ERROR_CODES.INVALID_SESSION
          : AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
        ok: false,
      };
    }

    if (!data.user?.id) {
      return { error: AUTH_ERROR_CODES.INVALID_SESSION, ok: false };
    }

    return { ok: true, user: { id: data.user.id } };
  } catch {
    return { error: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE, ok: false };
  }
}
