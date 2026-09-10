import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createUpcomingEventRepository } from "./repository";

describe("upcoming event repository", () => {
  it("uses an inclusive instant boundary, stable ordering, and public fields only", async () => {
    const calls: unknown[][] = [];
    const query = { eq(column: string, value: string) { calls.push(["eq", column, value]); return this; }, gte(column: string, value: string) { calls.push(["gte", column, value]); return this; }, order(column: string) { calls.push(["order", column]); if (column === "id") return Promise.resolve({ data: [{ id: "event-1", location: "Fictional Hall", name: "Current event", starts_at: value }], error: null }); return this; } };
    const value = "2026-09-10T10:00:00.000Z";
    const select = vi.fn((_columns: string) => { calls.push(["select", _columns]); return query; });
    const repository = createUpcomingEventRepository(async () => ({ from: vi.fn(() => ({ select })) }) as never);
    await expect(repository.listFrom(value)).resolves.toEqual([{ id: "event-1", location: "Fictional Hall", name: "Current event", startsAt: value }]);
    expect(calls).toEqual([["select", "id, name, starts_at, location"], ["eq", "status", "scheduled"], ["gte", "starts_at", value], ["order", "starts_at"], ["order", "id"]]);
  });
});
