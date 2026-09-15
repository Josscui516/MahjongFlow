export type UpcomingEventSummary = Readonly<{
  id: string;
  location: string;
  name: string;
  startsAt: string;
}>;

export type UpcomingEventsResult =
  | Readonly<{ state: "not_connected" }>
  | Readonly<{ events: readonly UpcomingEventSummary[]; state: "ready" }>
  | Readonly<{ state: "permission_denied" }>
  | Readonly<{ state: "error" }>;

export type UpcomingEventsPort = Readonly<{
  listUpcoming(now: Date): Promise<UpcomingEventsResult>;
}>;
