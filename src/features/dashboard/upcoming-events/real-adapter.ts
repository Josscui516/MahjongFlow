import { listUpcomingEvents } from "@/features/events/upcoming";
import type { UpcomingEventQueryResult } from "@/features/events/upcoming";
import type { UpcomingEventsPort } from "./contracts";

type Query = (now: Date) => Promise<UpcomingEventQueryResult>;

export function createRealUpcomingEventsPort(query: Query = listUpcomingEvents): UpcomingEventsPort {
  return { async listUpcoming(now) { const result = await query(now); if (result.ok) return { events: result.items, state: "ready" }; return result.code === "PERMISSION_DENIED" ? { state: "permission_denied" } : { state: "error" }; } };
}
