import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ list: vi.fn(), register: vi.fn(), changeStatus: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("./service", () => ({ registrationService: mocks }));
import { registerParticipant, changeRegistrationStatus, searchRegistrations } from "./actions";
const eventId = "27000000-0000-4000-8000-000000000001";
describe("registration server action refresh boundaries", () => {
  beforeEach(() => { vi.resetAllMocks(); });
  it("refreshes registration and event counts after successful writes", async () => {
    mocks.register.mockResolvedValue({ ok: true, eventId, outcome: "created", status: "registered" });
    await registerParticipant({ eventId, participantId: eventId });
    expect(mocks.revalidatePath.mock.calls).toEqual([[`/registrations/${eventId}`], [`/events/${eventId}`]]);
  });
  it("does not refresh when a write fails", async () => {
    mocks.changeStatus.mockResolvedValue({ ok: false, code: "PERMISSION_DENIED" });
    await changeRegistrationStatus({ eventId, registrationId: eventId, status: "cancelled", expectedUpdatedAt: "2026-09-08T00:00:00Z" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
  it("reports successful persistence and explicit refresh advice if invalidation fails", async () => {
    mocks.register.mockResolvedValue({ ok: true, eventId, outcome: "created", status: "registered" });
    mocks.revalidatePath.mockImplementation(() => { throw new Error("cache unavailable"); });
    expect(await registerParticipant({ eventId, participantId: eventId })).toEqual({ ok: true, eventId, outcome: "created", status: "registered", refreshRequired: true });
  });
});

it("routes searches through the authorised service without invalidating pages", async () => {
  mocks.revalidatePath.mockClear();
  mocks.list.mockResolvedValue({ ok: false, code: "PERMISSION_DENIED" });
  expect(await searchRegistrations(eventId, 2, "Fictional")).toEqual({ ok: false, code: "PERMISSION_DENIED" });
  expect(mocks.list).toHaveBeenCalledWith(eventId, 2, "Fictional");
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
});
