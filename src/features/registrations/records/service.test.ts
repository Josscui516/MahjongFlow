import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));
import { AuthorizationError, type AccessContext } from "@/lib/auth/authorization";
import { createRegistrationService } from "./service";
import { RegistrationRepositoryError, type RegistrationRepository } from "./repository";
import type { RegistrationCreateInput } from "./contracts";
import { validCreateInput, validUpdateInput } from "./validation";

const eventId = "27000000-0000-4000-8000-000000000001";
const participantId = "27000000-0000-4000-8000-000000000002";
const registrationId = "27000000-0000-4000-8000-000000000003";
const update = { eventId, registrationId, status: "cancelled" as const, expectedUpdatedAt: "2026-09-08T12:00:00.123456+00:00" };
function setup(role = "authorised") {
  const repository = {
    create: vi.fn().mockResolvedValue({ created: true, status: "registered" }),
    update: vi.fn().mockResolvedValue("updated"),
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    count: vi.fn().mockResolvedValue(0),
  } satisfies RegistrationRepository;
  const authorise = vi.fn().mockResolvedValue({ userId: participantId, role, canManageAccounts: false } as AccessContext);
  return { repository, authorise, service: createRegistrationService({ authorise, repository }) };
}
describe("registration service authorisation and state contract", () => {
  it.each(["committee", "participant", "unexpected"])("denies %s before any sensitive lookup/write", async (role) => {
    const { service, repository } = setup(role);
    for (const result of [await service.list(eventId), await service.register({ eventId, participantId }), await service.changeStatus(update)]) {
      expect(result).toEqual({ ok: false, code: "PERMISSION_DENIED" });
    }
    expect(repository.list).not.toHaveBeenCalled(); expect(repository.create).not.toHaveBeenCalled(); expect(repository.update).not.toHaveBeenCalled();
  });
  it("denies anonymous requests before even validating identifiers", async () => {
    const { service, authorise, repository } = setup();
    authorise.mockRejectedValue(new AuthorizationError("UNAUTHENTICATED"));
    expect(await service.register({ eventId: "bad", participantId })).toEqual({ ok: false, code: "UNAUTHENTICATED" });
    expect(await service.count(eventId)).toEqual({ ok: false, code: "UNAUTHENTICATED" });
    expect(await service.list(eventId, 1, "Fictional")).toEqual({ ok: false, code: "UNAUTHENTICATED" });
    expect(repository.list).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled(); expect(repository.count).not.toHaveBeenCalled();
  });
  it.each(["committee", "authorised"])("returns only the safe count for %s", async (role) => {
    const { service, repository } = setup(role);
    expect(await service.count(eventId)).toEqual({ ok: true, eventId, registrationCount: 0 });
    expect(repository.list).not.toHaveBeenCalled();
  });
  it("distinguishes zero, unavailable event and failure", async () => {
    const { service, repository } = setup();
    repository.count.mockResolvedValueOnce(null);
    expect(await service.count(eventId)).toEqual({ ok: false, code: "UNAVAILABLE" });
    repository.count.mockRejectedValueOnce(new Error("private database diagnostics"));
    expect(await service.count(eventId)).toEqual({ ok: false, code: "SYSTEM_ERROR" });
  });
  it("creates, reports duplicates and preserves cancelled duplicate status", async () => {
    const { service, repository } = setup();
    expect(await service.register({ eventId, participantId })).toEqual({ ok: true, eventId, outcome: "created", status: "registered" });
    repository.create.mockResolvedValueOnce({ created: false, status: "cancelled" });
    expect(await service.register({ eventId, participantId })).toEqual({ ok: true, eventId, outcome: "duplicate", status: "cancelled" });
    expect(repository.update).not.toHaveBeenCalled();
  });
  it.each(["updated", "unchanged", "conflict", "unavailable"] as const)("maps status result %s", async (outcome) => {
    const { service, repository } = setup(); repository.update.mockResolvedValue(outcome);
    const result = await service.changeStatus(update);
    expect(result).toEqual(outcome === "conflict" || outcome === "unavailable" ? { ok: false, code: outcome.toUpperCase() } : { ok: true, eventId, status: "cancelled", outcome });
  });
  it.each(["23503", "23514", "22P02", "42501", "PGRST301", "unexpected"])("safely maps repository error %s", async (code) => {
    const { service, repository } = setup(); repository.create.mockRejectedValue(new RegistrationRepositoryError(code));
    expect(await service.register({ eventId, participantId })).toEqual({ ok: false, code: ["23503", "23514", "22P02"].includes(code) ? "VALIDATION" : ["42501", "PGRST301"].includes(code) ? "PERMISSION_DENIED" : "SYSTEM_ERROR" });
  });
  it.each([null, {}, [], { eventId, participantId, recorded_by: participantId }, { eventId, participantId, status: "cancelled" }, { eventId, participantId, privacy_notice_acknowledged_at: "now" }, { eventId: "bad", participantId }])("rejects malformed create input and extra fields: %j", async (input) => {
    const { service, repository } = setup();
    expect(await service.register(input as RegistrationCreateInput)).toEqual({ ok: false, code: "VALIDATION" });
    expect(repository.create).not.toHaveBeenCalled();
  });
  it.each([0, -1, 1.1, NaN, 10001])("rejects invalid page %s before querying", async (page) => {
    const { service, repository } = setup();
    expect(await service.list(eventId, page)).toEqual({ ok: false, code: "VALIDATION" });
    expect(repository.list).not.toHaveBeenCalled();
  });
  it("preserves global list count and unavailable result", async () => {
    const { service, repository } = setup(); repository.list.mockResolvedValueOnce({ items: [], total: 51 });
    expect(await service.list(eventId, 3)).toEqual({ ok: true, eventId, items: [], total: 51, page: 3 });
    expect(repository.list).toHaveBeenCalledWith(eventId, 3, "");
    repository.list.mockResolvedValueOnce(null);
    expect(await service.list(eventId)).toEqual({ ok: false, code: "UNAVAILABLE" });
  });
  it("validates only registration inputs, not another owner's identity rules", () => {
    expect(validCreateInput({ eventId, participantId })).toBe(true);
    expect(validUpdateInput(update)).toBe(true);
    for (const value of [{ ...update, status: "attended" }, { ...update, expectedUpdatedAt: "today" }, { ...update, recordedBy: participantId }]) expect(validUpdateInput(value)).toBe(false);
  });
});

it("authorises and bounds search text before querying", async () => {
  const denied = setup("committee");
  expect(await denied.service.list(eventId, 1, "Fictional")).toEqual({ ok: false, code: "PERMISSION_DENIED" });
  expect(denied.repository.list).not.toHaveBeenCalled();
  const allowed = setup();
  expect(await allowed.service.list(eventId, 1, "x".repeat(101))).toEqual({ ok: false, code: "VALIDATION" });
  expect(allowed.repository.list).not.toHaveBeenCalled();
  await allowed.service.list(eventId, 2, " Fictional ");
  expect(allowed.repository.list).toHaveBeenCalledWith(eventId, 2, "Fictional");
});
