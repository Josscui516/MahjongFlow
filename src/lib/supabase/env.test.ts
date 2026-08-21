import { afterEach, describe, expect, it } from "vitest";

import {
  getSupabaseAdminEnvironment,
  getSupabasePublicEnvironment,
} from "@/lib/supabase/env";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const ORIGINAL_APP_URL = process.env.APP_BASE_URL;
const ORIGINAL_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ORIGINAL_KEY;
  process.env.APP_BASE_URL = ORIGINAL_APP_URL;
  process.env.SUPABASE_SECRET_KEY = ORIGINAL_SECRET_KEY;
});

describe("getSupabaseAdminEnvironment", () => {
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
  it("accepts the IPv4 loopback URL returned by the local Supabase CLI", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "local-test-key";

    expect(getSupabasePublicEnvironment()).toEqual({
      publishableKey: "local-test-key",
      url: "http://127.0.0.1:54321",
    });
  });
});
