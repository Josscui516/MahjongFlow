import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ authorised: vi.fn(), backend: vi.fn(), client: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/auth/authorization", async original => ({
  ...await original<typeof import("@/lib/auth/authorization")>(),
  requireAuthorised: mocks.authorised, requireBackendUser: mocks.backend,
}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.client }));
import { AuthorizationError } from "@/lib/auth/authorization";
import { submitMemberListChange } from "./member-submission-action";
const eventId = "ad100000-0000-4000-8000-000000000001";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.client.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ error: null });
});
it.each(["FORBIDDEN", "UNAUTHENTICATED"] as const)("denies registration submission for %s before creating a database client", async code => {
  mocks.authorised.mockRejectedValue(new AuthorizationError(code));
  expect(await submitMemberListChange("registration", eventId, new FormData())).toEqual({ ok: false, code: "PERMISSION_DENIED" });
  expect(mocks.client).not.toHaveBeenCalled();
});
it("retains authorised registration submissions", async () => {
  expect(await submitMemberListChange("registration", eventId, new FormData())).toEqual({ ok: true });
  expect(mocks.authorised).toHaveBeenCalledOnce();
  expect(mocks.rpc).toHaveBeenCalledWith("submit_member_list_change", expect.objectContaining({ target_list: "registration", target_event_id: eventId }));
});
it("requires authorised access for dinner roster submissions", async () => {
  expect(await submitMemberListChange("dinner", null, new FormData())).toEqual({ ok: true });
  expect(mocks.authorised).toHaveBeenCalledOnce();
  expect(mocks.backend).not.toHaveBeenCalled();
});

it.each(["add", "remove"])("denies General dinner %s before database access", async operation => {
  mocks.authorised.mockRejectedValue(new AuthorizationError("FORBIDDEN"));
  const form = new FormData(); form.set("operation", operation);
  expect(await submitMemberListChange("dinner", null, form)).toEqual({ ok: false, code: "PERMISSION_DENIED" });
  expect(mocks.client).not.toHaveBeenCalled();
});
