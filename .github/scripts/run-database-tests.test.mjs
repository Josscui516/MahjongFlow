import assert from "node:assert/strict";
import test from "node:test";

import {
  databaseTestEvidenceError,
  hasExecutedDatabaseTests,
} from "./run-database-tests.mjs";

test("accepts a passing database run with executable assertions", () => {
  const output = "Files=3, Tests=161, 1 wallclock secs\nResult: PASS";

  assert.equal(hasExecutedDatabaseTests(output), true);
  assert.equal(databaseTestEvidenceError(output), null);
});

test("rejects Supabase NOTESTS despite its successful process exit", () => {
  const output = "Files=0, Tests=0, 0 wallclock secs\nResult: NOTESTS";

  assert.equal(hasExecutedDatabaseTests(output), false);
  assert.match(databaseTestEvidenceError(output), /no executable SQL assertions/);
});

test("rejects a test file that contains no assertions", () => {
  assert.equal(hasExecutedDatabaseTests("Files=1, Tests=0\nResult: PASS"), false);
});

test("rejects output without a prove-compatible summary", () => {
  assert.equal(hasExecutedDatabaseTests("Database command completed"), false);
});
