import {
  createCheckInPostHandler,
  createDatabaseCheckInRateLimiter,
  createSelfCheckInGateway,
  createSelfCheckInService,
} from "@/features/attendance/self-check-in";

export const POST = createCheckInPostHandler((source, token, body) =>
  createSelfCheckInService({
    gateway: createSelfCheckInGateway(),
    limiter: createDatabaseCheckInRateLimiter(),
  })(source, token, body),
);
