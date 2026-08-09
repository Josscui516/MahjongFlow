---
name: project-delivery-workflow
description: Coordinate MahjongFlow delivery across GitHub Issues and Projects, Sprint integration branches, work-package and Sprint pull requests, scoped commits and pushes, review finding ownership, testing, merge confirmation, blockers, handoffs, and interrupted-work recovery. Use when a task references an Issue, Sprint, branch, commit, PR, review finding, Project status, delivery plan, deferred defect, blocker, handoff, or Git operation. Follow the mutation authority in the root AGENTS.md; this skill never independently authorises GitHub writes, commits, pushes, merges, history rewrites, branch deletion, or Project restructuring.
---

# Project Delivery Workflow

Read `../../../AGENTS.md`, `../../../README.md`, and `../../../docs/plans/week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md` before acting. Use `$mahjongflow-development` for implementation, architecture, data, and permission decisions.

## Establish scope and authority

1. Classify the request as read-only analysis, implementation, Issue work, Git delivery, PR work, merge, handoff, or recovery.
2. Do not turn implementation or diagnosis into an unauthorised branch, stage, commit, push, PR, Issue, Project, or merge mutation.
3. Treat each external mutation separately. Permission to pull does not authorise commit or push; permission to create a PR does not authorise merge; permission to update one Issue does not authorise batch changes.
4. Require a real Issue number before creating a branch, commit, push, or PR. Never invent an Issue or scope ID.
5. Preserve user-owned and unrelated changes. Stop write operations when scopes overlap and cannot be separated safely.

## Recover current state

Before acting, inspect:

- the latest request and approved plan;
- `git status --short`, current branch, remote, staged and unstaged diffs, and relevant commits;
- the linked Issue, including body, comments, labels, owner, dependencies, acceptance criteria, and Project state;
- the unified weekly plan, member work document, Sprint field, file ownership, frozen contracts, integration branch, and integration owner;
- the current PR, review threads, checks, and base/head relationship when one exists;
- the root README and directly affected authority documents.

After interruption or context compaction, rebuild exact state from the repository and GitHub. Do not rely on a summary for paths, acceptance criteria, validation, or merge readiness.

## Keep records in the right place

| Record | Purpose |
|---|---|
| `README.md` and `docs/` | Durable scope, architecture, permissions, Schema, operations, and conventions |
| Git diff and commit | Exact implementation history and one focused outcome |
| Pull Request | Review context, acceptance evidence, risks, rollback, and merge decision |
| GitHub Issue and Project | Value, owner, execution status, dependencies, blockers, acceptance, and handoff |

Link records instead of copying the same narrative everywhere. A GitHub decision that changes a durable contract must also update the appropriate local document.

## Run the Issue-linked workflow

1. Read the complete Issue context before implementation and reconcile it with local authority documents.
2. Search for an equivalent Issue before any authorised creation. Use one Issue per independently acceptable result and checklists only for inseparable internal steps.
3. Use the repository's actual labels and Project statuses. Do not mark `In Progress`, `Review`, `Testing`, or `Done` ahead of reality.
4. Record branch, PR, material validation, blockers, decisions, remaining acceptance, and next owner when the user authorises an Issue update.
5. Record blockers with cause, impact, attempted actions, required help, owner, start time, and next check time. Escalate blockers older than one workday using `blocked` or the repository's equivalent.
6. Keep new unapproved capabilities in Post-MVP. An Issue does not by itself authorise changing the approved MVP or a durable local contract.
7. Do not create Issues for brainstorming, temporary notes, or minor findings resolved in the same task.
8. Treat empty Project metadata as unknown until access is verified. Do not infer that an Issue is absent from a Project when the GitHub token or connector may lack Project read permission.

## Route through the Sprint

1. Read the weekly plan before branch work. Resolve the real Sprint integration branch, integration/acceptance Issue, member Issue, and expected base; never invent missing identifiers.
2. Create `sprint/<number>-<theme>` from current `main` only with authority. Create `codex/<issue>-<scope>` or a team branch from that Sprint branch.
3. Target work-package PRs at the Sprint branch and reference exactly one primary Issue. After approved integration, keep that Issue in `Testing`.
4. Open the Sprint integration PR from the Sprint branch to `main` only after every included Issue is in `Testing`. Use the weekly plan's integration/acceptance Issue as the single primary Issue and list all other items under `Included work package issues`.
5. Treat the Sprint PR as the deployment boundary. Re-run the complete integrated checks, validate migration order and rollback, and require explicit merge authority.
6. Allow `Done` and Issue closure only after the Sprint PR reaches `main`. Report any included Issue whose Sprint, status, acceptance gate, review, or checks do not match.

## Attribute review findings before requesting fixes

For every finding, compare the PR diff with the primary Issue, member plan, owned files, frozen input/output contracts, and pre-existing base behavior.

1. Block the current PR when its changes violate its Issue acceptance, owned output contract, file responsibility, or introduce a regression.
2. For a boundary failure, assign it to the provider whose output violates the frozen contract. Do not ask a consumer to edit another owner's files. If the frozen contract itself is wrong, pause integration and request a recorded contract decision.
3. Do not block the current PR for an unrelated pre-existing or other-work-package defect unless it creates an immediate security, data-loss, permission, or repository-wide build blocker. With write authority, track it against the correct Issue; otherwise report the required follow-up.
4. State for each blocking comment: classification, evidence, responsible Issue/owner, whether it blocks the current PR, the responsible owner's work-package PR, the coordination/integration Issue, or the Sprint PR, and how to verify resolution.
5. Separate route construction from route protection. The UI/layout owner creates the actual route surface; the authentication owner must make the frozen route namespaces enforce the authentication contract, including before those pages are implemented.
6. Separate feature-owned tests from test-platform ownership. A feature author owns the minimum unit, integration, route, and regression coverage required by that Issue; the test work package owns shared configuration, cross-package acceptance harnesses, CI, fixtures, and Sprint-level evidence.

## Execute an authorised Git lifecycle

1. Before every branch, stage, commit, push, or PR action, repeat the checks required by root `AGENTS.md`.
2. Create `codex/<issue-number>-<short-kebab-description>` from the weekly plan's Sprint integration branch only when branch creation is authorised. Create the Sprint branch itself from current `main`.
3. Implement one coherent Issue outcome and run risk-proportionate checks. Inspect the complete diff and run `git diff --check`.
4. Stage only explicit in-scope paths. Review `git diff --cached --check` and the full staged diff before an authorised commit.
5. Use `<type>: <imperative summary>` with an allowed type. Do not include unrelated changes, secrets, real participant data, temporary artifacts, or unverified work.
6. Before an authorised push, confirm remote, branch, and outgoing commits. Never force-push or delete a remote branch without separate explicit approval.
7. Before an authorised work-package PR, synchronise with its Sprint branch; before a Sprint PR, synchronise the Sprint branch with `main`. Complete the route, Sprint, primary Issue, included Issues, scope, checks, and review-attribution sections of the template.
8. Require non-author review and Testing before each merge. A work-package merge integrates into the Sprint branch; only the separately authorised Sprint PR may merge to `main` and complete Issues.

## Prepare a handoff

Include the Issue, branch, latest relevant commit, PR, completed scope, exact remaining work, checks and results, blockers, assumptions, risks, uncommitted files, next owner, and next safe action. State which next action needs user authority. Never include credentials, tokens, production configuration, or real participant data.

Write new documentation, plans, handoffs, ADRs, runbooks, Issue bodies, PR bodies, and substantive new sections in English. Preserve historical Chinese records unless the task explicitly requests translation or substantially rewrites them.

## Completion check

Verify that authority was respected, unrelated changes remain intact, Git and GitHub states match reality, acceptance and validation reflect the latest material change, durable decisions are documented locally, `Done` was not used before Review and Testing, and no merge occurred without explicit confirmation.
