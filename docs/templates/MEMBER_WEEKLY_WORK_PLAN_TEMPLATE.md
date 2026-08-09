# MahjongFlow Member Weekly Work Plan Template

> Usage: copy this file to `docs/plans/week-N/{UPPERCASE_MEMBER_NAME}_WEEKLY_WORK_PLAN.md`, replace every `{placeholder}`, and remove this note. Each member independently owns one work package and does not routinely pair or modify another work package.

## {Member name}: Course Week {X} (Development Week {Y}) Independent Work Plan

Unified weekly plan: [{weekly theme}](WEEK_{Y}_IMPLEMENTATION_PLAN.md)

Direct dependency documents: {write `None` when there is no direct dependency; otherwise link only the directly dependent member plans}

## 1. Independent objective

{Describe the result this member can deliver and verify independently during the week.}

## 2. Work package and file ownership

- Member: {name}
- GitHub assignee: `{login}`
- Work package: {work package}
- Primary Issue: #{one real primary Issue}
- GitHub Sprint: `Sprint {N}`
- Sprint integration branch: `sprint/{N}-{short-kebab-theme}`
- Issue branch: `{type}/{issue-number}-{short-description}`
- Work-package PR base: `sprint/{N}-{short-kebab-theme}`; never target `main` directly
- Sprint PR primary Issue: #{integration or acceptance Issue from the unified plan}
- Allowed changes: {owned files and directories}
- Prohibited changes: {other members' ownership ranges}
- Frozen input contracts: {interfaces, types, adapters, mocks, or fixtures that do not require continuous coordination}
- Output contract: {files, functions, types, adapters, or commands delivered to integration}
- Non-author reviewer: {member}

### Verification ownership

- This work package owns the minimum unit, integration, route, component, database, and regression tests required by its primary Issue.
- The Sprint test/acceptance work package owns shared test configuration, cross-package acceptance harnesses, CI/quality orchestration, shared fixtures, and Sprint-level evidence.
- List exact test paths owned here: {test files or directories}
- List test-platform inputs consumed but not modified here: {configuration, harness, fixtures, or commands}

### Route ownership, when applicable

- Actual page/layout/navigation owner: {Issue and member, or `Not applicable`}
- Authentication guard/matcher/redirect owner: {Issue and member, or `Not applicable`}
- Frozen protected URL namespaces: {paths, or `Not applicable`}

## 3. Start conditions

- {scope and acceptance conditions}
- {frozen input, mock, adapter, or fixture}
- {tools, environment, and permissions}
- {blocker that must be removed before starting}

## 4. Independent execution steps

### Step 1: establish the work-package baseline

Actions:

1. {action}
2. {action}
3. {record the baseline}

Output: {output}.

Verification: {verification method}.

### Step 2: complete the core implementation

Actions:

1. {action}
2. {action}
3. {remain inside the owned file range}

Output: {output}.

Verification: {verification method}.

### Step 3: individual tests and boundary verification

Actions:

1. {success path}
2. {failure, edge, or permission path}
3. {applicable quality commands}
4. Confirm that feature tests remain distinct from the shared Sprint acceptance harness.

Output: {individual verification evidence}.

Verification: {individual completion criteria}.

### Step 4: single handoff

Actions:

1. {prepare frozen outputs}
2. {record completed work, unfinished work, and risks}
3. Create or update a work-package PR that references only the primary Issue and targets the Sprint integration branch.
4. {deliver only at the shared integration checkpoint}

Output: {handoff package}.

Verification: non-author review has attributed findings to the current Issue, frozen contract, other work package, or pre-existing behavior; the recipient can integrate without reading undocumented implementation details.

## 5. Low-frequency communication rules

- Confirm scope, file ownership, and frozen interfaces once at the start of the week.
- Do not schedule routine syncs during independent implementation.
- Start temporary coordination only when an interface cannot be satisfied, a blocker exceeds the agreed time, or a security issue appears.
- Do not directly modify another member's files; submit the change request to the file owner.
- Complete one handoff after the work package is ready and one concentrated non-author review at the end of the week.

## 6. Individual deliverables

- {core deliverable}
- {feature-owned tests}
- {interface or usage documentation}
- {risk and handoff record}

## 7. Individual acceptance checklist

- [ ] The independent objective is complete.
- [ ] Only allowed files were modified.
- [ ] Outputs satisfy the frozen contract.
- [ ] Success, failure, edge, and applicable permission scenarios were verified.
- [ ] Feature-owned verification is complete without taking over shared acceptance-platform work.
- [ ] Applicable lint, typecheck, tests, and build pass.
- [ ] Permission, privacy, credential, and fictional-data requirements pass.
- [ ] The single handoff package is complete.
- [ ] The work-package PR has the correct Sprint, base/head, primary Issue, and file scope.
- [ ] After merge into the Sprint branch, the primary Issue remains in `Testing` and is not closed early.
- [ ] Every unfinished item has an owner, due date, and next check time.

## 8. Risks and issues

| Risk or issue | Impact | Temporary-coordination trigger | Response | Owner | Due date |
|---|---|---|---|---|---|
| {risk} | {impact} | {when coordination is required} | {action} | {name} | {due date} |

## 9. Unfinished-item handling

- Escalate only when the item blocks the individual deliverable or violates a frozen interface.
- Send non-blocking items to the backlog instead of repeatedly coordinating during the week.
- Do not bypass a blocker by editing another member's files.
- New requests do not expand the current work package without an approved scope decision.
- Escalate security, permission, data-loss, or credential risks immediately.

## 10. End-of-week handoff

- Completed: {results}
- Unfinished: {remaining item, reason, owner, and due date}
- Output contract: {directly usable interfaces, files, or commands}
- Integration notes: {minimum necessary explanation}
- Sprint PR evidence: {Issue, checks, review, and acceptance summary for the integration owner}
- Next-week recommendation: {follow-up action}
