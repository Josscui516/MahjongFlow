import { execFileSync, spawnSync } from "node:child_process";

try {
  const raw = execFileSync(process.execPath, [
    "node_modules/supabase/dist/supabase.js", "status", "-o", "json",
  ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000 });
  const config = JSON.parse(raw.slice(raw.indexOf("{")));
  if (new URL(config.API_URL).origin !== "http://127.0.0.1:45321") {
    throw new Error("Requires the dedicated local fixture database.");
  }
  if (!config.ANON_KEY || !config.SERVICE_ROLE_KEY) throw new Error("Missing local fixture keys.");
  const result = spawnSync(process.execPath, [
    "node_modules/vitest/vitest.mjs", "run",
    "src/features/dinner-verification/database.test.ts",
  ], {
    env: {
      ...process.env,
      ISSUE35_LIVE_DATABASE: "1",
      ISSUE35_LOCAL_URL: config.API_URL,
      ISSUE35_LOCAL_PUBLIC_KEY: config.ANON_KEY,
      ISSUE35_LOCAL_FIXTURE_KEY: config.SERVICE_ROLE_KEY,
    },
    stdio: "inherit",
  });
  process.exitCode = result.status ?? 1;
} catch {
  console.error("Issue 35 live verification could not start. Start the local Supabase fixture stack on port 45321; no credentials were printed.");
  process.exitCode = 1;
}
