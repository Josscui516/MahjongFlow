import { afterEach, describe, expect, it } from "vitest";

import { getSupabasePublicEnvironment } from "@/lib/supabase/env";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ORIGINAL_KEY;
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
