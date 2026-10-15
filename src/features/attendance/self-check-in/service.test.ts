import { describe, expect, it, vi } from "vitest";
import type { SelfCheckInOutcome } from "./contracts";
import { createSelfCheckInService, requestFingerprint } from "./service";

const token = "a".repeat(64);
const body = { fullName: "Fictional Person", privacyAccepted: true, email: "fictional@example.test", studentId: "TEST-0031" };

function dependencies() {
  return {
    gateway: { getContext: vi.fn(), submit: vi.fn(async (): Promise<SelfCheckInOutcome> => "success") },
    limiter: { consume: vi.fn(async () => true) },
  };
}

describe("self check-in service", () => {
  it("limits before the participant-sensitive atomic operation", async () => {
    const deps = dependencies();
    deps.limiter.consume.mockResolvedValue(false);
    await expect(createSelfCheckInService(deps)("203.0.113.31", token, body)).resolves.toEqual({ outcome: "rate_limited" });
    expect(deps.limiter.consume).toHaveBeenCalledWith(requestFingerprint("203.0.113.31", token));
    expect(deps.gateway.submit).not.toHaveBeenCalled();
  });

  it("returns only the atomic RPC outcome without participant data", async () => {
    const deps = dependencies();
    deps.gateway.submit.mockResolvedValue("already_processed");
    await expect(createSelfCheckInService(deps)("203.0.113.31", token, body)).resolves.toEqual({ outcome: "already_processed" });
    expect(deps.gateway.submit).toHaveBeenCalledWith({ ...body, token });
  });

  it("rate-limits malformed probes before rejecting them without persistence", async () => {
    const deps = dependencies();
    await expect(createSelfCheckInService(deps)("203.0.113.31", token, { email: "invalid" })).resolves.toEqual({ outcome: "unable_to_process" });
    expect(deps.limiter.consume).toHaveBeenCalledOnce();
    expect(deps.gateway.submit).not.toHaveBeenCalled();
  });

  it("maps unexpected failures to a retryable result with an opaque correlation id", async () => {
    const deps = dependencies();
    deps.gateway.submit.mockRejectedValue(new Error("fictional database detail"));
    const result = await createSelfCheckInService(deps)("203.0.113.31", token, body);
    expect(result).toMatchObject({ outcome: "system_error" });
    expect(result.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(result)).not.toContain("database detail");
  });

  it("creates non-reversible fixed-size fingerprints without retaining input", () => {
    const fingerprint = requestFingerprint("203.0.113.31", token);
    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(fingerprint).not.toContain("203.0.113.31");
    expect(requestFingerprint("203.0.113.32", token)).not.toBe(fingerprint);
  });
});
