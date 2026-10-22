import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each([
  ["development", "true", 1000],
  ["development", "false", undefined],
  ["production", "true", undefined],
] as const)("gates Docker polling for %s / %s", async (mode, enabled, expected) => {
  vi.stubEnv("NODE_ENV", mode);
  vi.stubEnv("LOCAL_DOCKER_POLLING", enabled);
  vi.resetModules();
  const { default: config } = await import("../../next.config");
  expect(config.watchOptions?.pollIntervalMs).toBe(expected);
  expect(config.output).toBe("standalone");
});

it("allows only the configured Docker host for LAN development assets", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_SAME_ORIGIN", "true");
  vi.stubEnv("LOCAL_DOCKER_HOST_IP", "49.100.10.20");
  vi.resetModules();
  const { default: config } = await import("../../next.config");
  expect(config.allowedDevOrigins).toEqual(["49.100.10.20"]);
});
