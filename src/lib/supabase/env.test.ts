import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getSupabaseAdminEnvironment,
  getSupabaseAuthOptions,
  getSupabasePublicEnvironment,
} from "@/lib/supabase/env";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const ORIGINAL_APP_URL = process.env.APP_BASE_URL;
const ORIGINAL_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ORIGINAL_KEY;
  process.env.APP_BASE_URL = ORIGINAL_APP_URL;
  process.env.SUPABASE_SECRET_KEY = ORIGINAL_SECRET_KEY;
});

describe("getSupabaseAdminEnvironment", () => {
  it.each(["10.0.0.8", "172.16.0.8", "172.31.255.254", "192.168.50.228"])(
    "allows the private LAN origin %s in development",
    (host) => {
      vi.stubEnv("NODE_ENV", "development");
      process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "local-test-key";
      process.env.SUPABASE_SECRET_KEY = "fictional-server-secret";
      process.env.APP_BASE_URL = `http://${host}:3000`;
      expect(getSupabaseAdminEnvironment().applicationUrl).toBe(`http://${host}:3000`);
    },
  );

  it.each([
    ["production", "192.168.50.228"],
    ["development", "172.32.0.8"],
    ["development", "192.168.50.999"],
    ["development", "203.0.113.8"],
  ])("rejects insecure nonlocal origins in %s at %s", (mode, host) => {
    vi.stubEnv("NODE_ENV", mode);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "local-test-key";
    process.env.SUPABASE_SECRET_KEY = "fictional-server-secret";
    process.env.APP_BASE_URL = `http://${host}:3000`;
    expect(() => getSupabaseAdminEnvironment()).toThrow("APP_BASE_URL must");
  });

  it("accepts only explicit server configuration for privileged workflows", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "local-test-key";
    process.env.APP_BASE_URL = "http://localhost:3000/";
    process.env.SUPABASE_SECRET_KEY = "fictional-server-secret";

    expect(getSupabaseAdminEnvironment()).toEqual({
      applicationUrl: "http://localhost:3000",
      secretKey: "fictional-server-secret",
      url: "http://127.0.0.1:54321",
    });
  });

  it("rejects a non-HTTPS deployed application origin", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fictional.supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fictional-key";
    process.env.APP_BASE_URL = "http://mahjongflow.example.test";
    process.env.SUPABASE_SECRET_KEY = "fictional-server-secret";

    expect(() => getSupabaseAdminEnvironment()).toThrow(
      "APP_BASE_URL must use HTTPS outside local development.",
    );
  });
});

describe("getSupabasePublicEnvironment", () => {
  it("uses the internal Docker gateway on the server and one shared auth cookie", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SAME_ORIGIN", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:3000/supabase");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fictional-key");
    vi.stubGlobal("window", undefined);
    expect(getSupabasePublicEnvironment().url).toBe("http://kong:8000");
    expect(getSupabaseAuthOptions()).toEqual({ storageKey: "mahjongflow-local-auth" });
  });

  it("uses the browser's current LAN origin for Docker API requests", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SAME_ORIGIN", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:3000/supabase");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fictional-key");
    vi.stubGlobal("window", { location: { origin: "http://192.168.1.75:3000" } });
    expect(getSupabasePublicEnvironment().url).toBe("http://192.168.1.75:3000/supabase");
  });

  it("accepts the IPv4 loopback URL returned by the local Supabase CLI", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "local-test-key";

    expect(getSupabasePublicEnvironment()).toEqual({
      publishableKey: "local-test-key",
      url: "http://127.0.0.1:54321",
    });
  });
});
