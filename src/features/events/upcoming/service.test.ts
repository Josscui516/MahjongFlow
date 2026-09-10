import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { AuthorizationError } from "@/lib/auth/authorization";
import { createUpcomingEventService } from "./service";

const now = new Date("2026-09-10T10:00:00.000Z");
const access = async () => ({ canManageAccounts: false, role: "committee" as const, userId: "fictional-user" });

describe("upcoming event service", () => {
  it("passes one fixed instant and preserves repository order", async () => {
    const items = [{ id: "current", location: "A", name: "Current", startsAt: now.toISOString() }, { id: "future", location: "B", name: "Future", startsAt: "2026-09-11T10:00:00.000Z" }];
    const listFrom = vi.fn(async () => items);
    await expect(createUpcomingEventService({ authorise: access, repository: { listFrom } })(now)).resolves.toEqual({ items, ok: true });
    expect(listFrom).toHaveBeenCalledWith(now.toISOString());
  });

  it("returns a real empty result separately from failures", async () => {
    await expect(createUpcomingEventService({ authorise: access, repository: { listFrom: async () => [] } })(now)).resolves.toEqual({ items: [], ok: true });
    const listFrom = vi.fn();
    await expect(createUpcomingEventService({ authorise: async () => { throw new AuthorizationError("UNAUTHENTICATED"); }, repository: { listFrom } })(now)).resolves.toEqual({ code: "PERMISSION_DENIED", ok: false });
    expect(listFrom).not.toHaveBeenCalled();
  });

  it("rejects an invalid clock before persistence", async () => {
    const listFrom = vi.fn();
    await expect(createUpcomingEventService({ authorise: access, repository: { listFrom } })(new Date(Number.NaN))).resolves.toEqual({ code: "VALIDATION", ok: false });
    expect(listFrom).not.toHaveBeenCalled();
  });
});
