import { describe, expect, it, vi } from "vitest";
import { listAllRegistrations } from "./list-all";

describe("complete registration roster", () => {
  it("loads remaining pages in bounded parallel batches and preserves page order", async () => {
    let active = 0;
    let peak = 0;
    const list = vi.fn(async (_eventId: string, page: number) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, page % 2));
      active--;
      return { ok: true as const, eventId: "event", total: 175, page, items: [{ id: String(page) }] };
    });
    const result = await listAllRegistrations("event", list as unknown as Parameters<typeof listAllRegistrations>[1]);
    expect(peak).toBe(4);
    expect(list).toHaveBeenCalledTimes(7);
    expect(result.ok && result.items.map(item => item.id)).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  });
  it("loads pages beyond the first 25 instead of silently truncating the roster", async () => {
    const list = vi.fn().mockResolvedValueOnce({ ok: true, eventId: "event", total: 34, page: 1, items: [{ id: "first" }] }).mockResolvedValueOnce({ ok: true, total: 34, page: 2, items: [{ id: "last" }] });
    const result = await listAllRegistrations("event", list);
    expect(list).toHaveBeenNthCalledWith(2, "event", 2);
    expect(result.ok && result.items.map(item => item.id)).toEqual(["first", "last"]);
  });
  it("returns a later page failure instead of presenting a partial roster", async () => {
    const list = vi.fn().mockResolvedValueOnce({ ok: true, total: 34, page: 1, items: [] }).mockResolvedValueOnce({ ok: false, code: "PERMISSION_DENIED" });
    expect(await listAllRegistrations("event", list)).toEqual({ ok: false, code: "PERMISSION_DENIED" });
  });
});
