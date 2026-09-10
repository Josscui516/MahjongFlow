import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { listTaskEventOptions } from "./options";

describe("task event options", () => {
  it("adapts the real event summary contract without exposing extra fields", async () => {
    const result = await listTaskEventOptions(async () => ({ items: [{ eventType: "weekly_session", id: "11111111-1111-4111-8111-111111111111", location: "Fictional Hall", name: "Fictional session", startsAt: "2026-09-20T01:00:00Z", status: "scheduled" }], ok: true }));
    expect(result).toEqual({ items: [{ id: "11111111-1111-4111-8111-111111111111", label: "Fictional session — 2026-09-20" }], ok: true });
  });

  it("preserves permission failures", async () => {
    await expect(listTaskEventOptions(async () => ({ code: "PERMISSION_DENIED", ok: false }))).resolves.toEqual({ code: "PERMISSION_DENIED", ok: false });
  });
});
