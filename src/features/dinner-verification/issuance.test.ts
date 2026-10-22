import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ authorise: vi.fn(), client: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/auth/authorization", async original => ({
  ...await original<typeof import("@/lib/auth/authorization")>(), requireAuthorised: mocks.authorise,
}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.client }));
import { AuthorizationError } from "@/lib/auth/authorization";
import { recordDinnerIssued } from "./issuance";
const event="a2100000-0000-4000-8000-000000000001", participant="a2200000-0000-4000-8000-000000000001";
beforeEach(() => { vi.resetAllMocks(); mocks.client.mockResolvedValue({ rpc: mocks.rpc }); });
it("checks authorisation before validating input or opening a client", async () => {
  mocks.authorise.mockRejectedValue(new AuthorizationError("FORBIDDEN"));
  expect(await recordDinnerIssued("invalid", participant, true, false)).toEqual({ ok:false, code:"PERMISSION_DENIED" });
  expect(mocks.client).not.toHaveBeenCalled();
});
it("does not send malformed event scope to the database", async () => {
  expect(await recordDinnerIssued("invalid", participant, true, false)).toEqual({ ok:false, code:"VALIDATION" });
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each([["42501","PERMISSION_DENIED"],["PDI01","REFRESH_REQUIRED"],["40001","REFRESH_REQUIRED"],["other","SYSTEM_ERROR"]])("maps %s safely to %s",async (code,expected) => {
  mocks.rpc.mockResolvedValue({ error:{ code, message:"private detail" } });
  expect(await recordDinnerIssued(event,participant,true,false)).toEqual({ok:false,code:expected});
});
it("uses a session RPC without accepting a forged operator",async()=>{
  mocks.rpc.mockResolvedValue({error:null,data:"2026-10-18T00:00:00Z"});
  expect(await recordDinnerIssued(event,participant,true,false)).toEqual({ok:true});
  expect(mocks.rpc).toHaveBeenCalledWith("set_event_dinner_issued",{target_event_id:event,target_participant_id:participant,desired_issued:true,expected_issued:false});
});
