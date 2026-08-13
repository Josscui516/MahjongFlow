import fs from "node:fs";

const STATUS_FLOW = [
  "Backlog",
  "Ready",
  "In Progress",
  "Review",
  "Testing",
  "Done",
];

export function acceptanceGate(body = "") {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) =>
    /^#{1,6}\s+acceptance criteria\s*$/i.test(line.trim()),
  );

  if (start < 0) return { name: "Not checked", checked: 0, total: 0 };

  const section = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s+/.test(line.trim())) break;
    section.push(line);
  }

  const boxes = section
    .map((line) => line.match(/^\s*[-*+]\s+\[([ xX])\]\s+/))
    .filter(Boolean);
  if (boxes.length === 0) {
    return { name: "Not checked", checked: 0, total: 0 };
  }

  const checked = boxes.filter((match) => /x/i.test(match[1])).length;
  return {
    name: checked === boxes.length ? "Passed" : "Incomplete",
    checked,
    total: boxes.length,
  };
}

export function issueNumberFromBranch(branch = "") {
  const match = branch.match(
    /^(?:feature|fix|docs|test|refactor|chore|codex)\/(\d+)-[a-z0-9][a-z0-9-]*$/,
  );
  return match ? Number(match[1]) : null;
}

export function sprintNumberFromBranch(branch = "") {
  const match = branch.match(/^sprint\/(\d+)-[a-z0-9][a-z0-9-]*$/);
  return match ? Number(match[1]) : null;
}

export function issueNumbersFromPullRequest(body = "", branch = "") {
  const numbers = new Set();
  const referencePattern =
    /\b(?:relates\s+to|close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi;
  for (const match of body.matchAll(referencePattern)) {
    numbers.add(Number(match[1]));
  }
  const branchNumber = issueNumberFromBranch(branch);
  if (branchNumber) numbers.add(branchNumber);
  return [...numbers];
}

export function includedIssueNumbersFromPullRequest(body = "") {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) =>
    /^#{1,6}\s+included work package issues\s*$/i.test(line.trim()),
  );
  if (start < 0) return [];

  const numbers = new Set();
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s+/.test(line.trim())) break;
    const match = line.match(/^\s*[-*+]\s+(?:\[[ xX]\]\s+)?#(\d+)\b/);
    if (match) numbers.add(Number(match[1]));
  }
  return [...numbers];
}

function sortedUniqueIssueNumbers(numbers) {
  return [...new Set(numbers.map(Number))].sort((left, right) => left - right);
}

export function deliveryReferencesChanged(previousBody = "", currentBody = "", branch = "") {
  const previousPrimary = sortedUniqueIssueNumbers(
    issueNumbersFromPullRequest(previousBody, branch),
  );
  const currentPrimary = sortedUniqueIssueNumbers(
    issueNumbersFromPullRequest(currentBody, branch),
  );
  const previousIncluded = sortedUniqueIssueNumbers(
    includedIssueNumbersFromPullRequest(previousBody),
  );
  const currentIncluded = sortedUniqueIssueNumbers(
    includedIssueNumbersFromPullRequest(currentBody),
  );
  return (
    previousPrimary.join(",") !== currentPrimary.join(",") ||
    previousIncluded.join(",") !== currentIncluded.join(",")
  );
}

export function pullRequestRoute(pull) {
  const baseSprint = sprintNumberFromBranch(pull.base?.ref ?? "");
  const headSprint = sprintNumberFromBranch(pull.head?.ref ?? "");
  const headIssue = issueNumberFromBranch(pull.head?.ref ?? "");

  if (baseSprint && headIssue) {
    return { kind: "work-package", sprint: baseSprint };
  }
  if (pull.base?.ref === "main" && headSprint) {
    return { kind: "sprint-integration", sprint: headSprint };
  }
  throw new Error(
    `Invalid Pull Request route '${pull.head?.ref ?? "unknown"}' -> '${pull.base?.ref ?? "unknown"}'. ` +
      "Work-package PRs must target sprint/<number>-<theme>; only Sprint integration PRs may target main.",
  );
}

export function checksPassed(
  checkRuns = [],
  statuses = [],
  { ignoredCheckNames = [] } = {},
) {
  const ignoredNames = new Set(ignoredCheckNames);
  const relevantCheckRuns = checkRuns.filter(
    (check) => !ignoredNames.has(check.name),
  );
  if (relevantCheckRuns.length + statuses.length === 0) return false;
  const acceptableConclusions = new Set(["success", "neutral", "skipped"]);
  return (
    relevantCheckRuns.every(
      (check) =>
        check.status === "completed" &&
        acceptableConclusions.has(String(check.conclusion).toLowerCase()),
    ) &&
    statuses.every((status) => String(status.state).toLowerCase() === "success")
  );
}

export function hasIndependentApproval(reviews = [], authorLogin = "") {
  const latestByReviewer = new Map();
  for (const review of reviews) {
    const login = review.user?.login;
    if (login) latestByReviewer.set(login.toLowerCase(), review.state);
  }
  return [...latestByReviewer.entries()].some(
    ([login, state]) =>
      login !== authorLogin.toLowerCase() && state === "APPROVED",
  );
}

class GitHubClient {
  constructor(token, repository) {
    this.token = token;
    [this.repoOwner, this.repoName] = repository.split("/");
  }

  async request(path, options = {}) {
    const response = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`${options.method ?? "GET"} ${path}: ${response.status} ${await response.text()}`);
    }
    return response.status === 204 ? null : response.json();
  }

  async graphql(query, variables) {
    const result = await this.request("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    if (result.errors?.length) {
      throw new Error(result.errors.map((error) => error.message).join("; "));
    }
    return result.data;
  }
}

export class ProjectAutomation {
  constructor({ client, owner, number, actor, repository }) {
    this.client = client;
    this.owner = owner;
    this.number = Number(number);
    this.actor = actor;
    this.repository = repository;
  }

  async projectSnapshot() {
    const data = await this.client.graphql(
      `query ProjectSnapshot($owner: String!, $number: Int!) {
        user(login: $owner) {
          projectV2(number: $number) {
            id
            fields(first: 50) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options { id name }
                }
              }
            }
            items(first: 100) {
              nodes {
                id
                content {
                  ... on Issue {
                    id
                    number
                    repository { nameWithOwner }
                    assignees(first: 20) { nodes { login } }
                  }
                }
                fieldValues(first: 30) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      optionId
                      field { ... on ProjectV2SingleSelectField { id name } }
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      { owner: this.owner, number: this.number },
    );
    const project = data.user?.projectV2;
    if (!project) throw new Error(`Project ${this.owner}/${this.number} was not found.`);
    return project;
  }

  async issue(number) {
    return this.client.request(
      `/repos/${this.repository}/issues/${number}`,
    );
  }

  findField(project, name) {
    const field = project.fields.nodes.find((candidate) => candidate?.name === name);
    if (!field) throw new Error(`Project field '${name}' was not found.`);
    return field;
  }

  findItem(project, number) {
    return project.items.nodes.find(
      (item) =>
        item.content?.number === Number(number) &&
        item.content?.repository?.nameWithOwner === this.repository,
    );
  }

  statusOf(item) {
    return this.singleSelectValue(item, "Status");
  }

  singleSelectValue(item, fieldName) {
    return item?.fieldValues.nodes.find((value) => value?.field?.name === fieldName)
      ?.name;
  }

  assertSprint(context, sprint) {
    const actual = this.singleSelectValue(context.item, "Sprint");
    const expected = `Sprint ${sprint}`;
    if (actual !== expected) {
      throw new Error(
        `Issue #${context.issue.number} belongs to '${actual ?? "no Sprint"}', expected '${expected}'.`,
      );
    }
  }

  sprintIssueNumbers(project, sprint) {
    const expectedSprint = `Sprint ${sprint}`;
    return sortedUniqueIssueNumbers(
      project.items.nodes
        .filter(
          (item) =>
            item.content?.repository?.nameWithOwner === this.repository &&
            this.singleSelectValue(item, "Sprint") === expectedSprint,
        )
        .map((item) => item.content.number),
    );
  }

  assertExactSprintIssueSet(project, sprint, declaredNumbers) {
    const expected = this.sprintIssueNumbers(project, sprint);
    const declared = sortedUniqueIssueNumbers(declaredNumbers);
    const expectedSet = new Set(expected);
    const declaredSet = new Set(declared);
    const missing = expected.filter((number) => !declaredSet.has(number));
    const extra = declared.filter((number) => !expectedSet.has(number));
    if (missing.length > 0 || extra.length > 0) {
      const details = [
        missing.length > 0 ? `missing ${missing.map((number) => `#${number}`).join(", ")}` : null,
        extra.length > 0 ? `extra ${extra.map((number) => `#${number}`).join(", ")}` : null,
      ].filter(Boolean);
      throw new Error(
        `Sprint ${sprint} Issue set does not match Project membership: ${details.join("; ")}.`,
      );
    }
  }

  async ensureItem(project, issue) {
    const existing = this.findItem(project, issue.number);
    if (existing) return { project, item: existing };

    const data = await this.client.graphql(
      `mutation AddItem($project: ID!, $content: ID!) {
        addProjectV2ItemById(input: {projectId: $project, contentId: $content}) {
          item { id }
        }
      }`,
      { project: project.id, content: issue.node_id },
    );
    return {
      project,
      item: { id: data.addProjectV2ItemById.item.id, fieldValues: { nodes: [] } },
    };
  }

  async setSingleSelect(project, item, fieldName, optionName) {
    const field = this.findField(project, fieldName);
    const option = field.options.find((candidate) => candidate.name === optionName);
    if (!option) throw new Error(`Option '${optionName}' is missing from '${fieldName}'.`);
    await this.client.graphql(
      `mutation UpdateField($project: ID!, $item: ID!, $field: ID!, $option: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $project
          itemId: $item
          fieldId: $field
          value: {singleSelectOptionId: $option}
        }) { projectV2Item { id } }
      }`,
      { project: project.id, item: item.id, field: field.id, option: option.id },
    );
    console.log(`Set ${fieldName}=${optionName}.`);
  }

  async prepareIssue(number) {
    const [issue, initialProject] = await Promise.all([
      this.issue(number),
      this.projectSnapshot(),
    ]);
    const ensured = await this.ensureItem(initialProject, issue);
    const project = this.findItem(initialProject, number)
      ? initialProject
      : await this.projectSnapshot();
    const item = this.findItem(project, number) ?? ensured.item;
    const gate = acceptanceGate(issue.body ?? "");
    await this.setSingleSelect(project, item, "Acceptance Gate", gate.name);
    return { issue, project, item, gate, status: this.statusOf(item) };
  }

  async transition(context, from, to) {
    if (!from.includes(context.status)) {
      throw new Error(
        `Refusing ${context.status ?? "unset"} -> ${to}; expected ${from.join(" or ")}.`,
      );
    }
    if (!STATUS_FLOW.includes(to)) throw new Error(`Unknown status '${to}'.`);
    await this.setSingleSelect(context.project, context.item, "Status", to);
    context.status = to;
  }

  async completeSprintIssue(context) {
    if (context.status === "Testing") {
      await this.transition(context, ["Testing"], "Done");
    } else if (context.status !== "Done") {
      throw new Error(
        `Issue #${context.issue.number} must be in Testing or Done before Sprint completion.`,
      );
    }

    if (context.issue.state !== "closed") {
      await this.client.request(`/repos/${this.repository}/issues/${context.issue.number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "closed", state_reason: "completed" }),
      });
      context.issue.state = "closed";
    }
  }

  assertActorAssigned(issue) {
    const assignees = issue.assignees.map((assignee) => assignee.login);
    if (!assignees.includes(this.actor)) {
      throw new Error(
        `Branch creator ${this.actor} is not assigned to issue #${issue.number}.`,
      );
    }
  }

  assertWipLimit(context) {
    const assignees = new Set(context.issue.assignees.map((assignee) => assignee.login));
    const conflicting = context.project.items.nodes.find((item) => {
      if (item.content?.number === context.issue.number) return false;
      if (this.statusOf(item) !== "In Progress") return false;
      return item.content?.assignees?.nodes.some((assignee) => assignees.has(assignee.login));
    });
    if (conflicting) {
      throw new Error(
        `WIP limit exceeded: an assignee already owns In Progress issue #${conflicting.content.number}.`,
      );
    }
  }

  async pullRequestEvidence(number) {
    const [pull, reviews] = await Promise.all([
      this.client.request(`/repos/${this.repository}/pulls/${number}`),
      this.client.request(`/repos/${this.repository}/pulls/${number}/reviews?per_page=100`),
    ]);
    const [checks, statuses, threadData] = await Promise.all([
      this.client.request(
        `/repos/${this.repository}/commits/${pull.head.sha}/check-runs?per_page=100`,
      ),
      this.client.request(
        `/repos/${this.repository}/commits/${pull.head.sha}/status`,
      ),
      this.client.graphql(
        `query ReviewThreads($owner: String!, $repo: String!, $number: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) {
              reviewThreads(first: 100) { nodes { isResolved } }
            }
          }
        }`,
        {
          owner: this.client.repoOwner,
          repo: this.client.repoName,
          number,
        },
      ),
    ]);
    return {
      pull,
      reviews,
      checksPassed: checksPassed(
        checks.check_runs,
        [{ state: statuses.state }],
        { ignoredCheckNames: ["update-project"] },
      ),
      approved: hasIndependentApproval(reviews, pull.user.login),
      unresolvedThreads:
        threadData.repository.pullRequest.reviewThreads.nodes.filter(
          (thread) => !thread.isResolved,
        ).length,
    };
  }

  async handleIssue(action, number) {
    const context = await this.prepareIssue(number);
    if (action === "opened" || action === "reopened") {
      await this.setSingleSelect(context.project, context.item, "Status", "Backlog");
    }
  }

  async handleBranch(branch) {
    const number = issueNumberFromBranch(branch);
    if (!number) {
      console.log(`Ignoring branch '${branch}': it does not match the project convention.`);
      return;
    }
    const context = await this.prepareIssue(number);
    this.assertActorAssigned(context.issue);
    this.assertWipLimit(context);
    await this.transition(context, ["Ready"], "In Progress");
  }

  async handlePullRequest(action, payload) {
    const pull = payload.pull_request;
    const route = pullRequestRoute(pull);
    const numbers = issueNumbersFromPullRequest(pull.body ?? "", pull.head.ref);
    if (numbers.length !== 1) {
      throw new Error(
        `Pull Request #${pull.number} must reference exactly one primary issue; found ${numbers.length}.`,
      );
    }
    const context = await this.prepareIssue(numbers[0]);
    this.assertSprint(context, route.sprint);
    const includedNumbers = includedIssueNumbersFromPullRequest(pull.body ?? "");

    if (route.kind === "work-package" && includedNumbers.length > 0) {
      throw new Error("A work-package PR must not declare included work-package issues.");
    }
    if (route.kind === "sprint-integration") {
      if (includedNumbers.length === 0) {
        throw new Error("A Sprint integration PR must list included work-package issues.");
      }
      if (includedNumbers.includes(context.issue.number)) {
        throw new Error("The Sprint integration primary issue must not be repeated as an included issue.");
      }
    }

    if (action === "edited") {
      const previousBody = payload.changes?.body?.from;
      if (
        typeof previousBody === "string" &&
        deliveryReferencesChanged(previousBody, pull.body ?? "", pull.head.ref) &&
        context.status === "Testing"
      ) {
        await this.transition(context, ["Testing"], "Review");
      }
      if (route.kind === "sprint-integration") {
        this.assertExactSprintIssueSet(context.project, route.sprint, [
          context.issue.number,
          ...includedNumbers,
        ]);
      }
      return;
    }

    if (route.kind === "sprint-integration") {
      this.assertExactSprintIssueSet(context.project, route.sprint, [
        context.issue.number,
        ...includedNumbers,
      ]);
    }

    if (
      (action === "opened" || action === "reopened" || action === "ready_for_review") &&
      !pull.draft
    ) {
      if (route.kind === "sprint-integration") {
        if (action === "opened" && context.status !== "Testing") {
          throw new Error(
            `Sprint integration primary issue #${context.issue.number} must be in Testing before the Sprint PR opens.`,
          );
        }
        const included = await Promise.all(
          includedNumbers.map((number) => this.prepareIssue(number)),
        );
        for (const item of included) {
          this.assertSprint(item, route.sprint);
          if (item.status !== "Testing") {
            throw new Error(
              `Included issue #${item.issue.number} must be in Testing before the Sprint PR opens.`,
            );
          }
        }
        await this.transition(context, ["In Progress", "Testing"], "Review");
      } else {
        await this.transition(context, ["In Progress"], "Review");
      }
      return;
    }
    if (action === "synchronize" && ["In Progress", "Testing"].includes(context.status)) {
      await this.transition(context, ["In Progress", "Testing"], "Review");
      return;
    }
    if (action === "converted_to_draft" || (action === "closed" && !pull.merged)) {
      if (["Review", "Testing"].includes(context.status)) {
        await this.transition(context, ["Review", "Testing"], "In Progress");
      }
      return;
    }
    if (action === "closed" && pull.merged) {
      const evidence = await this.pullRequestEvidence(pull.number);
      if (context.gate.name !== "Passed") {
        throw new Error(`Issue #${context.issue.number} acceptance criteria are not all checked.`);
      }
      if (!evidence.approved) throw new Error("A non-author approval is required.");
      if (!evidence.checksPassed) throw new Error("All configured checks must pass, and at least one check is required.");
      if (evidence.unresolvedThreads > 0) throw new Error("All review threads must be resolved.");

      if (route.kind === "work-package") {
        if (context.status !== "Testing") {
          throw new Error(`Integrated issue #${context.issue.number} must remain in Testing.`);
        }
        console.log(
          `Work-package issue #${context.issue.number} is integrated into Sprint ${route.sprint} and remains in Testing.`,
        );
        return;
      }

      const included = await Promise.all(
        includedNumbers.map((number) => this.prepareIssue(number)),
      );
      for (const item of [...included, context]) {
        this.assertSprint(item, route.sprint);
        if (item.gate.name !== "Passed") {
          throw new Error(`Issue #${item.issue.number} acceptance criteria are not all checked.`);
        }
        if (!["Testing", "Done"].includes(item.status)) {
          throw new Error(
            `Issue #${item.issue.number} must be in Testing or Done before Sprint completion.`,
          );
        }
      }

      for (const item of [...included, context]) {
        await this.completeSprintIssue(item);
      }
    }
  }

  async handleReview(action, payload) {
    if (action !== "submitted" && action !== "dismissed") return;
    const pull = payload.pull_request;
    const route = pullRequestRoute(pull);
    const numbers = issueNumbersFromPullRequest(pull.body ?? "", pull.head.ref);
    if (numbers.length !== 1) {
      throw new Error(`Pull Request #${pull.number} must reference exactly one primary issue.`);
    }
    const context = await this.prepareIssue(numbers[0]);
    this.assertSprint(context, route.sprint);
    if (route.kind === "sprint-integration") {
      const includedNumbers = includedIssueNumbersFromPullRequest(pull.body ?? "");
      this.assertExactSprintIssueSet(context.project, route.sprint, [
        context.issue.number,
        ...includedNumbers,
      ]);
    }
    const state = payload.review?.state;
    if (state === "changes_requested" && ["Review", "Testing"].includes(context.status)) {
      await this.transition(context, ["Review", "Testing"], "In Progress");
      return;
    }
    if (action === "dismissed" && context.status === "Testing") {
      await this.transition(context, ["Testing"], "Review");
      return;
    }
    if (state === "approved" && context.status === "Review") {
      const evidence = await this.pullRequestEvidence(pull.number);
      if (!evidence.approved) throw new Error("A non-author approval is required.");
      if (!evidence.checksPassed) throw new Error("All configured checks must pass, and at least one check is required.");
      if (evidence.unresolvedThreads > 0) throw new Error("All review threads must be resolved.");
      await this.transition(context, ["Review"], "Testing");
    }
  }
}

async function main() {
  const token = process.env.PROJECT_TOKEN;
  if (!token) {
    throw new Error("PROJECT_TOKEN is required. Configure it as a repository Actions secret.");
  }
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const automation = new ProjectAutomation({
    client: new GitHubClient(token, process.env.GITHUB_REPOSITORY),
    owner: process.env.PROJECT_OWNER,
    number: process.env.PROJECT_NUMBER,
    actor: process.env.GITHUB_ACTOR,
    repository: process.env.GITHUB_REPOSITORY,
  });

  switch (process.env.GITHUB_EVENT_NAME) {
    case "issues":
      await automation.handleIssue(event.action, event.issue.number);
      break;
    case "create":
      if (event.ref_type === "branch") await automation.handleBranch(event.ref);
      break;
    case "pull_request_target":
      await automation.handlePullRequest(event.action, event);
      break;
    case "pull_request_review":
      await automation.handleReview(event.action, event);
      break;
    default:
      console.log(`Ignoring unsupported event '${process.env.GITHUB_EVENT_NAME}'.`);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname.replace(/^\/(.:)/, "$1")) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
