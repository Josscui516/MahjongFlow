import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const TEST_SUMMARY = /\bFiles=(\d+),\s+Tests=(\d+)\b/;

export function hasExecutedDatabaseTests(output) {
  const match = output.match(TEST_SUMMARY);

  return (
    match !== null &&
    Number.parseInt(match[1], 10) > 0 &&
    Number.parseInt(match[2], 10) > 0 &&
    !/\bResult:\s*NOTESTS\b/.test(output)
  );
}

export function databaseTestEvidenceError(output) {
  if (hasExecutedDatabaseTests(output)) {
    return null;
  }

  return "Database acceptance is blocked: no executable SQL assertions were reported.";
}

function runDatabaseTests() {
  const result = spawnSync(
    process.execPath,
    [
      resolve("node_modules", "supabase", "dist", "supabase.js"),
      "test",
      "db",
      "--local",
    ],
    { encoding: "utf8" },
  );

  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");

  if (result.error) {
    console.error("Database test command could not be started.");
    process.exitCode = 1;
    return;
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return;
  }

  const evidenceError = databaseTestEvidenceError(
    `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
  );

  if (evidenceError) {
    console.error(evidenceError);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runDatabaseTests();
}
