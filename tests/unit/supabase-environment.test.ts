import { afterEach, expect, test, vi } from "vitest";

import { getSupabasePublicEnvironment } from "@/lib/supabase/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("loads and normalizes fictional local Supabase public configuration", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321/");
  vi.stubEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "fictional-publishable-key",
  );

  expect(getSupabasePublicEnvironment()).toEqual({
    publishableKey: "fictional-publishable-key",
    url: "http://localhost:54321",
  });
});
