import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ auth: vi.fn(), client: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireBackendUser: mocks.auth }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.client }));
import { readDinnerEligibilityCount } from "./safe-count";
const eventId = "36000000-0000-4000-8000-000000000001";
beforeEach(() => { vi.resetAllMocks(); mocks.client.mockResolvedValue({ rpc: mocks.rpc }); });
it.each(["committee", "authorised"])("returns only an aggregate to %s", async role => {
  mocks.auth.mockResolvedValue({ role }); mocks.rpc.mockResolvedValue({ data: 2, error: null });
  expect(await readDinnerEligibilityCount(eventId)).toBe(2);
  expect(mocks.rpc).toHaveBeenCalledWith("get_event_dinner_eligibility_total", { target_event_id: eventId });
});
it("checks access before any database read", async () => {
  mocks.auth.mockRejectedValue(new Error("denied"));
  expect(await readDinnerEligibilityCount(eventId)).toBeNull();
  expect(mocks.client).not.toHaveBeenCalled();
});
it.each([null, -1, 1.5, "2"])("does not fabricate a count for %s", async data => {
  mocks.rpc.mockResolvedValue({ data, error: null });
  expect(await readDinnerEligibilityCount(eventId)).toBeNull();
});
