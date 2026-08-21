import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
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

export function findDatabaseTestFiles(
  directory = resolve("supabase", "tests"),
) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        return findDatabaseTestFiles(path);
      }

      return entry.isFile() && /\.(?:pg|sql)$/i.test(entry.name) ? [path] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

function runDatabaseTests() {
  const testFiles = findDatabaseTestFiles();
  const cliPath = resolve("node_modules", "supabase", "dist", "supabase.js");

  if (testFiles.length === 0) {
    console.error("Database acceptance is blocked: no SQL test files were found.");
    process.exitCode = 1;
    return;
  }

  for (const testFile of testFiles) {
    const portablePath = relative(process.cwd(), testFile).replaceAll("\\", "/");
    const result = spawnSync(
      process.execPath,
      [cliPath, "test", "db", portablePath, "--local"],
      { encoding: "utf8" },
    );
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");

    if (result.error) {
      console.error(`Database test could not be started: ${portablePath}`);
      process.exitCode = 1;
      continue;
    }

    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      continue;
    }

    const evidenceError = databaseTestEvidenceError(output);

    if (evidenceError) {
      console.error(`${evidenceError} File: ${portablePath}`);
      process.exitCode = 1;
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runDatabaseTests();
}
