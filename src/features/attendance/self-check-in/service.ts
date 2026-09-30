import { createHash, randomUUID } from "node:crypto";
import type { CheckInRateLimiter, SelfCheckInGateway, SelfCheckInResult } from "./contracts";
import { parseSelfCheckInInput } from "./validation";

type Dependencies = Readonly<{
  gateway: SelfCheckInGateway;
  limiter: CheckInRateLimiter;
}>;

export function requestFingerprint(source: string, token: string): string {
  return createHash("sha256").update(source).update("\0").update(token).digest("hex");
}

export function createSelfCheckInService({ gateway, limiter }: Dependencies) {
  return async function submitSelfCheckIn(
    source: string,
    token: string,
    body: unknown,
  ): Promise<SelfCheckInResult> {
    try {
      if (!(await limiter.consume(requestFingerprint(source, token)))) return { outcome: "rate_limited" };
      const input = parseSelfCheckInInput(token, body);
      if (!input) return { outcome: "unable_to_process" };
      const outcome = await gateway.submit(input);
      return outcome === "system_error" ? { correlationId: randomUUID(), outcome } : { outcome };
    } catch {
      return { correlationId: randomUUID(), outcome: "system_error" };
    }
  };
}
