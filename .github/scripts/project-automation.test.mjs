import assert from "node:assert/strict";
import test from "node:test";

import {
  acceptanceGate,
  checksPassed,
  deliveryReferencesChanged,
  hasIndependentApproval,
  includedIssueNumbersFromPullRequest,
  issueNumberFromBranch,
  issueNumbersFromPullRequest,
  ProjectAutomation,
  pullRequestRoute,
  sprintNumberFromBranch,
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

test("sprintNumberFromBranch accepts only the Sprint integration convention", () => {
  assert.equal(sprintNumberFromBranch("sprint/2-auth-foundation"), 2);
  assert.equal(sprintNumberFromBranch("sprint/auth-foundation"), null);
  assert.equal(sprintNumberFromBranch("feature/2-auth-foundation"), null);
});

test("includedIssueNumbersFromPullRequest reads only the dedicated section", () => {
  assert.deepEqual(
    includedIssueNumbersFromPullRequest(`
Relates to #41

## Included work package issues

- #9
- [x] #10
- #39
- #9

## Risks

- #999 is not an included issue
`),
    [9, 10, 39],
  );
  assert.deepEqual(includedIssueNumbersFromPullRequest("Relates to #41"), []);
});

test("deliveryReferencesChanged detects only primary or included Issue changes", () => {
  const previous = "Relates to #41\n\n## Included work package issues\n\n- #9\n- #39";
  assert.equal(
    deliveryReferencesChanged(
      previous,
      `${previous}\n\n## Risks\n\nUpdated explanation only.`,
      "sprint/2-auth-foundation",
    ),
    false,
  );
  assert.equal(
    deliveryReferencesChanged(
      previous,
      "Relates to #41\n\n## Included work package issues\n\n- #9",
      "sprint/2-auth-foundation",
    ),
    true,
  );
});

test("pullRequestRoute distinguishes work-package and Sprint integration PRs", () => {
  assert.deepEqual(
    pullRequestRoute({
      head: { ref: "feature/39-schema-baseline" },
      base: { ref: "sprint/2-auth-foundation" },
    }),
    { kind: "work-package", sprint: 2 },
  );
  assert.deepEqual(
    pullRequestRoute({
      head: { ref: "sprint/2-auth-foundation" },
      base: { ref: "main" },
    }),
    { kind: "sprint-integration", sprint: 2 },
  );
  assert.throws(
    () =>
      pullRequestRoute({
        head: { ref: "feature/39-schema-baseline" },
        base: { ref: "main" },
      }),
    /Work-package PRs must target/,
  );
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

function projectContext(number, { status = "Testing", gate = "Passed", sprint = 2 } = {}) {
  return {
    issue: { number, state: "open" },
    project: null,
    item: {
      content: { number, repository: { nameWithOwner: "owner/repo" } },
      fieldValues: {
        nodes: [
          { name: status, field: { name: "Status" } },
          { name: `Sprint ${sprint}`, field: { name: "Sprint" } },
        ],
      },
    },
    gate: { name: gate },
    status,
  };
}

class TestAutomation extends ProjectAutomation {
  constructor(contexts, { failRequestAt = null } = {}) {
    const requests = [];
    let requestNumber = 0;
    let pendingFailure = failRequestAt;
    super({
      client: {
        request: async (path, options) => {
          requests.push({ path, options });
          requestNumber += 1;
          if (requestNumber === pendingFailure) {
            pendingFailure = null;
            throw new Error("Injected request failure");
          }
          return {};
        },
      },
      owner: "owner",
      number: 5,
      actor: "reviewer",
      repository: "owner/repo",
    });
    const project = {
      items: { nodes: [...contexts.values()].map((context) => context.item) },
    };
    for (const context of contexts.values()) context.project = project;
    this.contexts = contexts;
    this.requests = requests;
    this.transitions = [];
  }

  async prepareIssue(number) {
    return this.contexts.get(number);
  }

  async pullRequestEvidence() {
    return { approved: true, checksPassed: true, unresolvedThreads: 0 };
  }

  async transition(context, from, to) {
    assert.ok(from.includes(context.status));
    this.transitions.push([context.issue.number, context.status, to]);
    context.status = to;
  }
}

test("a merged work-package PR leaves its issue in Testing", async () => {
  const automation = new TestAutomation(new Map([[39, projectContext(39)]]));
  await automation.handlePullRequest("closed", {
    pull_request: {
      number: 101,
      merged: true,
      draft: false,
      body: "Relates to #39",
      head: { ref: "feature/39-schema-baseline" },
      base: { ref: "sprint/2-auth-foundation" },
    },
  });
  assert.deepEqual(automation.transitions, []);
  assert.deepEqual(automation.requests, []);
});

test("a new commit returns a changes-requested work-package PR to Review", async () => {
  const automation = new TestAutomation(
    new Map([[39, projectContext(39, { status: "In Progress" })]]),
  );
  await automation.handlePullRequest("synchronize", {
    pull_request: {
      number: 104,
      merged: false,
      draft: false,
      body: "Relates to #39",
      head: { ref: "feature/39-schema-baseline" },
      base: { ref: "sprint/2-auth-foundation" },
    },
  });
  assert.deepEqual(automation.transitions, [[39, "In Progress", "Review"]]);
});

test("opening a Sprint PR requires included issues in Testing", async () => {
  const automation = new TestAutomation(
    new Map([
      [41, projectContext(41)],
      [9, projectContext(9)],
      [39, projectContext(39, { status: "In Progress" })],
    ]),
  );
  await assert.rejects(
    automation.handlePullRequest("opened", {
      pull_request: {
        number: 102,
        merged: false,
        draft: false,
        body: "Relates to #41\n\n## Included work package issues\n\n- #9\n- #39",
        head: { ref: "sprint/2-auth-foundation" },
        base: { ref: "main" },
      },
    }),
    /Included issue #39 must be in Testing/,
  );
});

test("a Sprint PR must declare every Issue in the authoritative Project Sprint", async () => {
  const automation = new TestAutomation(
    new Map([
      [41, projectContext(41)],
      [9, projectContext(9)],
      [39, projectContext(39)],
    ]),
  );
  await assert.rejects(
    automation.handlePullRequest("opened", {
      pull_request: {
        number: 106,
        merged: false,
        draft: false,
        body: "Relates to #41\n\n## Included work package issues\n\n- #9",
        head: { ref: "sprint/2-auth-foundation" },
        base: { ref: "main" },
      },
    }),
    /does not match Project membership: missing #39/,
  );
});

test("a Sprint PR rejects Issues outside the authoritative Project Sprint", async () => {
  const automation = new TestAutomation(
    new Map([
      [41, projectContext(41)],
      [9, projectContext(9)],
      [39, projectContext(39)],
    ]),
  );
  await assert.rejects(
    automation.handlePullRequest("opened", {
      pull_request: {
        number: 107,
        merged: false,
        draft: false,
        body:
          "Relates to #41\n\n## Included work package issues\n\n- #9\n- #39\n- #99",
        head: { ref: "sprint/2-auth-foundation" },
        base: { ref: "main" },
      },
    }),
    /does not match Project membership: extra #99/,
  );
});

test("a post-approval Sprint Issue omission returns the PR to Review and fails validation", async () => {
  const automation = new TestAutomation(
    new Map([
      [41, projectContext(41)],
      [9, projectContext(9)],
      [39, projectContext(39)],
    ]),
  );
  const previousBody =
    "Relates to #41\n\n## Included work package issues\n\n- #9\n- #39";
  const currentBody = "Relates to #41\n\n## Included work package issues\n\n- #9";
  await assert.rejects(
    automation.handlePullRequest("edited", {
      changes: { body: { from: previousBody } },
      pull_request: {
        number: 108,
        merged: false,
        draft: false,
        body: currentBody,
        head: { ref: "sprint/2-auth-foundation" },
        base: { ref: "main" },
      },
    }),
    /does not match Project membership: missing #39/,
  );
  assert.deepEqual(automation.transitions, [[41, "Testing", "Review"]]);
});

test("an unrelated Sprint PR body edit keeps the current review state", async () => {
  const automation = new TestAutomation(
    new Map([
      [41, projectContext(41)],
      [9, projectContext(9)],
      [39, projectContext(39)],
    ]),
  );
  const references =
    "Relates to #41\n\n## Included work package issues\n\n- #9\n- #39";
  await automation.handlePullRequest("edited", {
    changes: { body: { from: `${references}\n\n## Risks\n\nOld wording.` } },
    pull_request: {
      number: 109,
      merged: false,
      draft: false,
      body: `${references}\n\n## Risks\n\nNew wording.`,
      head: { ref: "sprint/2-auth-foundation" },
      base: { ref: "main" },
    },
  });
  assert.deepEqual(automation.transitions, []);
});

test("opening a Sprint PR requires its primary issue in Testing", async () => {
  const automation = new TestAutomation(
    new Map([
      [41, projectContext(41, { status: "In Progress" })],
      [9, projectContext(9)],
    ]),
  );
  await assert.rejects(
    automation.handlePullRequest("opened", {
      pull_request: {
        number: 105,
        merged: false,
        draft: false,
        body: "Relates to #41\n\n## Included work package issues\n\n- #9",
        head: { ref: "sprint/2-auth-foundation" },
        base: { ref: "main" },
      },
    }),
    /primary issue #41 must be in Testing/,
  );
});

test("a merged Sprint PR completes and closes the full included set", async () => {
  const automation = new TestAutomation(
    new Map([
      [41, projectContext(41)],
      [9, projectContext(9)],
      [39, projectContext(39)],
    ]),
  );
  await automation.handlePullRequest("closed", {
    pull_request: {
      number: 103,
      merged: true,
      draft: false,
      body: "Relates to #41\n\n## Included work package issues\n\n- #9\n- #39",
      head: { ref: "sprint/2-auth-foundation" },
      base: { ref: "main" },
    },
  });
  assert.deepEqual(automation.transitions, [
    [9, "Testing", "Done"],
    [39, "Testing", "Done"],
    [41, "Testing", "Done"],
  ]);
  assert.deepEqual(
    automation.requests.map((request) => request.path),
    [
      "/repos/owner/repo/issues/9",
      "/repos/owner/repo/issues/39",
      "/repos/owner/repo/issues/41",
    ],
  );
});

test("Sprint completion retries safely after a mid-batch request failure", async () => {
  const contexts = new Map([
    [41, projectContext(41)],
    [9, projectContext(9)],
    [39, projectContext(39)],
  ]);
  const automation = new TestAutomation(contexts, { failRequestAt: 2 });
  const payload = {
    pull_request: {
      number: 110,
      merged: true,
      draft: false,
      body: "Relates to #41\n\n## Included work package issues\n\n- #9\n- #39",
      head: { ref: "sprint/2-auth-foundation" },
      base: { ref: "main" },
    },
  };

  await assert.rejects(
    automation.handlePullRequest("closed", payload),
    /Injected request failure/,
  );
  assert.equal(contexts.get(9).status, "Done");
  assert.equal(contexts.get(9).issue.state, "closed");
  assert.equal(contexts.get(39).status, "Done");
  assert.equal(contexts.get(39).issue.state, "open");
  assert.equal(contexts.get(41).status, "Testing");

  await automation.handlePullRequest("closed", payload);
  assert.deepEqual(
    [...contexts.values()].map((context) => [context.issue.number, context.status, context.issue.state]),
    [
      [41, "Done", "closed"],
      [9, "Done", "closed"],
      [39, "Done", "closed"],
    ],
  );
  assert.deepEqual(automation.transitions, [
    [9, "Testing", "Done"],
    [39, "Testing", "Done"],
    [41, "Testing", "Done"],
  ]);
});
