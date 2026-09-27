import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createCheckInPostHandler } from "@/features/attendance/self-check-in/http";

const token = "a".repeat(64);
const context = { params: Promise.resolve({ token }) };

describe("public check-in route", () => {
  it("passes a trusted forwarding origin and returns no-store success", async () => {
    const submit = vi.fn(async () => ({ outcome: "success" as const }));
    const response = await createCheckInPostHandler(submit)(new Request(`https://example.test/api/check-in/${token}`, { body: JSON.stringify({ email: "fictional@example.test" }), headers: { "content-type": "application/json", "x-vercel-forwarded-for": "203.0.113.31" }, method: "POST" }), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ outcome: "success" });
    expect(submit).toHaveBeenCalledWith("203.0.113.31", token, { email: "fictional@example.test" });
  });

  it("rejects oversized or malformed requests before the service", async () => {
    const submit = vi.fn();
    const unsupported = await createCheckInPostHandler(submit)(new Request("https://example.test", { body: "{}", method: "POST" }), context);
    expect(unsupported.status).toBe(415);
    const oversized = await createCheckInPostHandler(submit)(new Request("https://example.test", { body: "x", headers: { "content-length": "1025", "content-type": "application/json" }, method: "POST" }), context);
    expect(oversized.status).toBe(413);
    const malformed = await createCheckInPostHandler(submit)(new Request("https://example.test", { body: "not-json", headers: { "content-type": "application/json" }, method: "POST" }), context);
    expect(malformed.status).toBe(400);
    expect(submit).not.toHaveBeenCalled();
  });

  it("uses distinct safe statuses without returning participant facts", async () => {
    const submit = vi.fn(async () => ({ outcome: "rate_limited" as const }));
    const response = await createCheckInPostHandler(submit)(new Request("https://example.test", { body: JSON.stringify({ email: "fictional@example.test" }), headers: { "content-type": "application/json" }, method: "POST" }), context);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ outcome: "rate_limited" });
  });
});
