export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  INVALID_SESSION: "AUTH_INVALID_SESSION",
  SERVICE_UNAVAILABLE: "AUTH_SERVICE_UNAVAILABLE",
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export type LoginErrorCode = Extract<
  AuthErrorCode,
  | typeof AUTH_ERROR_CODES.INVALID_CREDENTIALS
  | typeof AUTH_ERROR_CODES.SERVICE_UNAVAILABLE
>;

export type LoginActionState = Readonly<{
  error: LoginErrorCode | null;
}>;

export type LogoutActionState = Readonly<{
  error: typeof AUTH_ERROR_CODES.SERVICE_UNAVAILABLE | null;
}>;

export type AuthenticatedUser = Readonly<{
  id: string;
}>;

export type AuthenticatedUserResult =
  | Readonly<{
      ok: true;
      user: AuthenticatedUser;
    }>
  | Readonly<{
      error: Extract<
        AuthErrorCode,
        | typeof AUTH_ERROR_CODES.INVALID_SESSION
        | typeof AUTH_ERROR_CODES.SERVICE_UNAVAILABLE
      >;
      ok: false;
    }>;
