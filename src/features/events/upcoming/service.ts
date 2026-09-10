import "server-only";

import { AuthorizationError, requireBackendUser, type AccessContext } from "@/lib/auth/authorization";
import type { UpcomingEventQueryResult } from "./contracts";
import { createUpcomingEventRepository, UpcomingEventRepositoryError, type UpcomingEventRepository } from "./repository";

type Dependencies = Readonly<{ authorise(): Promise<AccessContext>; repository: UpcomingEventRepository }>;
function errorCode(error: unknown) { return error instanceof AuthorizationError || (error instanceof UpcomingEventRepositoryError && ["42501", "PGRST301"].includes(error.code ?? "")) ? "PERMISSION_DENIED" as const : "SYSTEM_ERROR" as const; }

export function createUpcomingEventService({ authorise, repository }: Dependencies) {
  return async function listUpcomingEvents(now: Date): Promise<UpcomingEventQueryResult> {
    try {
      await authorise();
      if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return { code: "VALIDATION", ok: false };
      return { items: await repository.listFrom(now.toISOString()), ok: true };
    } catch (error) { return { code: errorCode(error), ok: false }; }
  };
}

export const listUpcomingEvents = createUpcomingEventService({ authorise: requireBackendUser, repository: createUpcomingEventRepository() });
