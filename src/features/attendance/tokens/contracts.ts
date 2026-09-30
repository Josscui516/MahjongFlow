export type CheckInTokenStatus = Readonly<{
  active: boolean;
  closesAt: string | null;
  createdAt: string | null;
  opensAt: string | null;
  revokedAt: string | null;
}>;

export type CheckInWindowInput = Readonly<{
  closesAt: string;
  opensAt: string;
}>;

export type CheckInWindowError = Readonly<{
  field: keyof CheckInWindowInput;
  message: string;
}>;

export type TokenManagementErrorCode =
  | "NOT_FOUND"
  | "PERMISSION_DENIED"
  | "SYSTEM_ERROR"
  | "VALIDATION";

export type TokenStatusResult =
  | Readonly<{ ok: true; status: CheckInTokenStatus }>
  | Readonly<{ code: Exclude<TokenManagementErrorCode, "VALIDATION">; ok: false }>;

export type TokenMutationResult =
  | Readonly<{
      createdAt: string;
      ok: true;
      qrDataUrl: string;
      url: string;
    }>
  | Readonly<{
      code: TokenManagementErrorCode;
      errors?: readonly CheckInWindowError[];
      ok: false;
    }>;

export type WindowMutationResult =
  | Readonly<{ closesAt: string; ok: true; opensAt: string }>
  | Readonly<{
      code: TokenManagementErrorCode;
      errors?: readonly CheckInWindowError[];
      ok: false;
    }>;

export type BasicTokenMutationResult =
  | Readonly<{ ok: true }>
  | Readonly<{ code: Exclude<TokenManagementErrorCode, "VALIDATION">; ok: false }>;

export interface CheckInTokenRepository {
  configureWindow(
    eventId: string,
    actorId: string,
    input: Readonly<{ closesAt: string; opensAt: string }>,
  ): Promise<Readonly<{ closesAt: string; opensAt: string }> | null>;
  getStatus(eventId: string, actorId: string): Promise<CheckInTokenStatus | null>;
  revoke(eventId: string, actorId: string): Promise<string>;
  rotate(
    eventId: string,
    actorId: string,
  ): Promise<Readonly<{ createdAt: string; token: string }> | null>;
}
