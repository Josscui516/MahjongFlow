import assert from "node:assert/strict";
import test from "node:test";

import {
  acceptanceGate,
  checksPassed,
  hasIndependentApproval,
  issueNumberFromBranch,
  issueNumbersFromPullRequest,
} from "./project-automation.mjs";

test("acceptanceGate returns Not checked when the section or checkboxes are absent", () => {
  assert.deepEqual(acceptanceGate("## Summary\nNothing here"), {
    name: "Not checked",
    checked: 0,
    total: 0,
  });
  assert.equal(acceptanceGate("## Acceptance criteria\nPlain text").name, "Not checked");
});

test("acceptanceGate distinguishes incomplete and passed criteria", () => {
  assert.deepEqual(
    acceptanceGate("## Acceptance criteria\n- [x] First\n- [ ] Second\n## Notes\n- [ ] Ignore"),
    { name: "Incomplete", checked: 1, total: 2 },
  );
  assert.equal(
    acceptanceGate("### Acceptance Criteria\n- [X] First\n* [x] Second").name,
    "Passed",
  );
});

test("issueNumberFromBranch accepts only approved branch conventions", () => {
  assert.equal(issueNumberFromBranch("feature/39-schema-baseline"), 39);
  assert.equal(issueNumberFromBranch("codex/41-quality-harness"), 41);
  assert.equal(issueNumberFromBranch("feature/schema-baseline"), null);
  assert.equal(issueNumberFromBranch("random/39-schema"), null);
});

test("issueNumbersFromPullRequest combines explicit and branch references without duplicates", () => {
  assert.deepEqual(
    issueNumbersFromPullRequest("Relates to #39", "feature/39-schema-baseline"),
    [39],
  );
  assert.deepEqual(issueNumbersFromPullRequest("Fixes #9 and resolves #10", "topic"), [9, 10]);
});

test("checksPassed requires at least one successful completed check", () => {
  assert.equal(checksPassed([], []), false);
  assert.equal(
    checksPassed([{ status: "completed", conclusion: "success" }], []),
    true,
  );
  assert.equal(
    checksPassed([{ status: "in_progress", conclusion: null }], []),
    false,
  );
  assert.equal(checksPassed([], [{ state: "failure" }]), false);
});

test("hasIndependentApproval ignores the author and uses each reviewer's latest state", () => {
  assert.equal(
    hasIndependentApproval([{ user: { login: "author" }, state: "APPROVED" }], "author"),
    false,
  );
  assert.equal(
    hasIndependentApproval(
      [
        { user: { login: "reviewer" }, state: "APPROVED" },
        { user: { login: "reviewer" }, state: "CHANGES_REQUESTED" },
      ],
      "author",
    ),
    false,
  );
  assert.equal(
    hasIndependentApproval([{ user: { login: "reviewer" }, state: "APPROVED" }], "author"),
    true,
  );
});
