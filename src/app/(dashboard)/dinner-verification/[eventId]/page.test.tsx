import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ access: vi.fn(), verified: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireBackendUser: mocks.access }));
vi.mock("@/features/dinner-verification/server", () => ({ readDinnerVerification: mocks.verified }));
vi.mock("@/features/dinner-verification/actions", () => ({ refreshDinnerVerification: vi.fn() }));
vi.mock("@/features/dinner-verification/issuance-action", () => ({ setDinnerIssued: vi.fn() }));
import Page from "./page";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.verified.mockResolvedValue({ ok: true, event: { id: "fixture", name: "Fictional Dinner" }, readAt: "2026-10-16T00:00:00Z", items: [], eligibleCount: 0 });
});
it.each([true,false])("uses a separate global roster page; administrator=%s", async canManageAccounts => {
  mocks.access.mockResolvedValue({ canManageAccounts,role:canManageAccounts ? "authorised":"committee" });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ eventId: "fixture" }) }));
  expect(html.includes('href="/dinner-roster"')).toBe(canManageAccounts);
  expect(html).not.toContain('name="fullName"');
  expect(html).not.toContain("Add to dinner roster");
});
