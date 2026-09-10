export type UpcomingEventDTO = Readonly<{ id: string; location: string; name: string; startsAt: string }>;
export type UpcomingEventQueryResult =
  | Readonly<{ items: readonly UpcomingEventDTO[]; ok: true }>
  | Readonly<{ code: "PERMISSION_DENIED" | "SYSTEM_ERROR" | "VALIDATION"; ok: false }>;
