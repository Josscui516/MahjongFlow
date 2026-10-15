import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ requireBackendUser: vi.fn() }));
vi.mock("@/lib/auth/authorization", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/auth/authorization")>(),
  requireBackendUser: mocks.requireBackendUser,
}));
import { requireQrManager } from "./authorization";
import { canManageEventQr } from "./permissions";
import { AuthorizationError } from "@/lib/auth/authorization";

beforeEach(() => vi.resetAllMocks());
it.each([
  ["committee", true, true], ["authorised", false, true],
  ["authorised", true, true], ["committee", false, false],
] as const)("QR visibility for %s, administrator=%s matches the server guard", async (role, canManageAccounts, permitted) => {
  const access = { role, canManageAccounts, userId: "fictional-user" };
  mocks.requireBackendUser.mockResolvedValue(access);
  expect(canManageEventQr(access)).toBe(permitted);
  if (permitted) expect(await requireQrManager()).toEqual(access);
  else await expect(requireQrManager()).rejects.toMatchObject({ code: "FORBIDDEN" });
});
it.each(["UNAUTHENTICATED", "FORBIDDEN"] as const)("preserves denied or inactive session rejection: %s", async code => {
  mocks.requireBackendUser.mockRejectedValue(new AuthorizationError(code));
  await expect(requireQrManager()).rejects.toMatchObject({ code });
});
