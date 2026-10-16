import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ access: vi.fn(), verified: vi.fn(), roster: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireAuthorised: mocks.access }));
vi.mock("@/features/dinner-verification/server", () => ({ readDinnerVerification: mocks.verified }));
vi.mock("@/features/dinner-verification/roster", () => ({ dinnerRosterService: { listForEvent: mocks.roster } }));
vi.mock("@/features/dinner-verification/actions", () => ({ refreshDinnerVerification: vi.fn(), addDinnerRosterEntry: vi.fn(), removeDinnerRosterMember: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import Page from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.verified.mockResolvedValue({ ok: true, event: { id: "fixture", name: "Fictional Dinner" }, readAt: "2026-10-16T00:00:00Z", items: [], eligibleCount: 0 });
  mocks.roster.mockResolvedValue({ ok: true, event: { id: "fixture", name: "Fictional Dinner" }, items: [{ eventId: "fixture", participantId: "roster-entry", participantName: "Fictional Pending Member", participantEmail: "pending@example.test", status: "listed" }] });
});
it("keeps the complete internal roster editable when no attendee has qualified yet", async () => {
  mocks.access.mockResolvedValue({ canManageAccounts: true });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ eventId: "fixture" }) }));
  expect(html).toContain("pending@example.test");
  expect(html).toContain("Remove from dinner roster");
  expect(html).toContain("No confirmed check-ins match the active internal dinner roster");
  expect(html).toContain('aria-label="Internal dinner roster"');
  expect(html).not.toContain('aria-label="Verified dinner attendees"');
});
it("does not load or expose the internal roster management list to nonadministrator staff", async () => {
  mocks.access.mockResolvedValue({ canManageAccounts: false });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ eventId: "fixture" }) }));
  expect(mocks.roster).not.toHaveBeenCalled();
  expect(html).not.toContain("pending@example.test");
  expect(html).not.toContain("Manage dinner roster");
});
