export type CheckInContext = Readonly<{
  eventName: string;
  location: string;
  startsAt: string;
  studentIdRequired: boolean;
}>;

export type CheckInContextResult =
  | Readonly<{ context: CheckInContext; ok: true }>
  | Readonly<{ code: "UNAVAILABLE" | "SYSTEM_ERROR"; ok: false }>;

export type SelfCheckInInput = Readonly<{
  email: string;
  studentId: string | null;
  token: string;
}>;

export type SelfCheckInOutcome =
  | "success"
  | "already_processed"
  | "unable_to_process"
  | "unavailable"
  | "rate_limited"
  | "system_error";

export type SelfCheckInResult = Readonly<{
  correlationId?: string;
  outcome: SelfCheckInOutcome;
}>;

export type SelfCheckInGateway = Readonly<{
  getContext(token: string): Promise<CheckInContextResult>;
  submit(input: SelfCheckInInput): Promise<SelfCheckInOutcome>;
}>;

export type CheckInRateLimiter = Readonly<{
  consume(fingerprint: string): Promise<boolean>;
}>;
