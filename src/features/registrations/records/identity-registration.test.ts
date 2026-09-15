import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ authorise: vi.fn(), event: vi.fn(), resolve: vi.fn(), register: vi.fn() }));
vi.mock("@/lib/auth/authorization", async (original) => ({ ...await original<object>(), requireAuthorised: mocks.authorise }));
vi.mock("@/features/events/core/service", () => ({ getEvent: mocks.event }));
vi.mock("@/features/registrations/participants/repository", async (original) => ({ ...await original<object>(), createParticipantRepository: () => ({ resolve: mocks.resolve }) }));
vi.mock("./actions", () => ({ registerParticipant: mocks.register }));
import { AuthorizationError } from "@/lib/auth/authorization";
import { registerIdentity } from "./identity-registration";
const id = "27000000-0000-4000-8000-000000000021";
const form = () => { const data = new FormData(); data.set("fullName", " Fictional Person "); data.set("email", "PERSON@example.test"); data.set("participantId", "forged"); data.set("requiresStudentId", "false"); return data; };
describe("real identity and registration composition", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.authorise.mockResolvedValue({ role: "authorised" }); mocks.event.mockResolvedValue({ ok: true, record: { requiresStudentId: false } }); mocks.resolve.mockResolvedValue({ outcome: "matched", participant: { id: "server-resolved-id", studentId: null } }); mocks.register.mockResolvedValue({ ok: true, eventId: id, status: "registered", outcome: "created" }); });
  it("normalises identity and uses only the server-resolved ID", async () => { expect(await registerIdentity(id, form())).toMatchObject({ ok: true }); expect(mocks.resolve).toHaveBeenCalledWith({ fullName: "Fictional Person", email: "person@example.test", studentId: null }); expect(mocks.register).toHaveBeenCalledWith({ eventId: id, participantId: "server-resolved-id" }); });
  it("uses the trusted event requirement despite forged browser fields", async () => { mocks.event.mockResolvedValue({ ok: true, record: { requiresStudentId: true } }); expect(await registerIdentity(id, form())).toMatchObject({ ok: false, code: "VALIDATION" }); expect(mocks.resolve).not.toHaveBeenCalled(); expect(mocks.register).not.toHaveBeenCalled(); });
  it("denies committee before reading event or participant data", async () => { mocks.authorise.mockRejectedValue(new AuthorizationError("FORBIDDEN")); expect(await registerIdentity(id, form())).toMatchObject({ ok: false, code: "PERMISSION_DENIED" }); expect(mocks.event).not.toHaveBeenCalled(); expect(mocks.register).not.toHaveBeenCalled(); });
  it("does not create identities for an unavailable event", async () => { mocks.event.mockResolvedValue({ ok: false, code: "NOT_FOUND" }); expect(await registerIdentity(id, form())).toMatchObject({ ok: false, code: "UNAVAILABLE" }); expect(mocks.resolve).not.toHaveBeenCalled(); });
  it("preserves the cancelled-duplicate result", async () => { mocks.register.mockResolvedValue({ ok: true, eventId: id, outcome: "duplicate", status: "cancelled" }); expect(await registerIdentity(id, form())).toMatchObject({ outcome: "duplicate", status: "cancelled" }); });
});
