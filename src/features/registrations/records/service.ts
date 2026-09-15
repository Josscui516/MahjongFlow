import "server-only";
import { AuthorizationError, requireBackendUser, type AccessContext } from "@/lib/auth/authorization";
import type { RegistrationCountResult, RegistrationFailure, RegistrationListResult, RegistrationMutationPort } from "./contracts";
import { createRegistrationRepository, RegistrationRepositoryError, type RegistrationRepository } from "./repository";
import { isRegistrationId, validCreateInput, validRegistrationPage, validUpdateInput } from "./validation";

function failure(error: unknown): RegistrationFailure {
  if (error instanceof AuthorizationError) return { ok: false, code: error.code === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "PERMISSION_DENIED" };
  if (error instanceof RegistrationRepositoryError) {
    if (["42501", "PGRST301"].includes(error.code ?? "")) return { ok: false, code: "PERMISSION_DENIED" };
    if (["23503", "23514", "22P02"].includes(error.code ?? "")) return { ok: false, code: "VALIDATION" };
  }
  return { ok: false, code: "SYSTEM_ERROR" };
}
export function createRegistrationService({ authorise, repository }: Readonly<{
  authorise: () => Promise<AccessContext>;
  repository: RegistrationRepository;
}>): RegistrationMutationPort & Readonly<{
  list: (eventId: string, page?: number, search?: string) => Promise<RegistrationListResult>;
  count: (eventId: string) => Promise<RegistrationCountResult>;
}> {
  async function check(sensitive: boolean) {
    const access = await authorise();
    if (!["authorised", "committee"].includes(access.role) || (sensitive && access.role !== "authorised")) {
      throw new AuthorizationError("FORBIDDEN");
    }
  }
  return {
    async register(input) {
      try {
        await check(true);
        if (!validCreateInput(input)) return { ok: false, code: "VALIDATION" };
        const result = await repository.create(input);
        return { ok: true, eventId: input.eventId, outcome: result.created ? "created" : "duplicate", status: result.status };
      } catch (error) { return failure(error); }
    },
    async changeStatus(input) {
      try {
        await check(true);
        if (!validUpdateInput(input)) return { ok: false, code: "VALIDATION" };
        const outcome = await repository.update(input);
        if (outcome === "conflict" || outcome === "unavailable") return { ok: false, code: outcome === "conflict" ? "CONFLICT" : "UNAVAILABLE" };
        return { ok: true, eventId: input.eventId, status: input.status, outcome };
      } catch (error) { return failure(error); }
    },
    async list(eventId, page = 1, search = "") {
      try {
        await check(true);
        if (!isRegistrationId(eventId) || !validRegistrationPage(page) || typeof search !== "string" || search.length > 100 || /[\u0000-\u001f]/.test(search)) return { ok: false, code: "VALIDATION" };
        const result = await repository.list(eventId, page, search.trim());
        return result ? { ok: true, eventId, page, ...result } : { ok: false, code: "UNAVAILABLE" };
      } catch (error) { return failure(error); }
    },
    async count(eventId) {
      try {
        await check(false);
        if (!isRegistrationId(eventId)) return { ok: false, code: "VALIDATION" };
        const registrationCount = await repository.count(eventId);
        return registrationCount === null ? { ok: false, code: "UNAVAILABLE" } : { ok: true, eventId, registrationCount };
      } catch (error) { return failure(error); }
    },
  };
}
export const registrationService = createRegistrationService({ authorise: requireBackendUser, repository: createRegistrationRepository() });
