# MahjongFlow Unified Weekly Implementation Plan Template

> Usage: copy this file to `docs/plans/week-N/WEEK_N_IMPLEMENTATION_PLAN.md`, replace every `{placeholder}`, and remove this note. A weekly plan contains five low-coupling work packages and does not create daily plans.

## Course Week {X} (Development Week {Y}): {Weekly theme}

> This plan follows the [MVP Project Proposal](../project/MVP_PROJECT_PROPOSAL.md). The approved scope for this week is: {scope and boundaries}.

## 1. Weekly objective

{Describe the independently verifiable capability that must exist by the end of the week.}

### Sprint delivery route

- GitHub Sprint: `Sprint {N}`
- Sprint integration branch: `sprint/{N}-{short-kebab-theme}`
- Integration owner: {member name}
- Sprint PR primary Issue: #{real integration or acceptance Issue}
- Sprint PR route: `sprint/{N}-{short-kebab-theme}` → `main`
- Other included work-package or coordination Issues: {real Sprint Issues excluding the primary Issue, or `None`}
- Remote branch, Project fields, and branch protection owner: {repository administrator or owner}

### Member work plans

- [{Member 1 name}]({MEMBER_1_UPPERCASE_NAME}_WEEKLY_WORK_PLAN.md)
- [{Member 2 name}]({MEMBER_2_UPPERCASE_NAME}_WEEKLY_WORK_PLAN.md)
- [{Member 3 name}]({MEMBER_3_UPPERCASE_NAME}_WEEKLY_WORK_PLAN.md)
- [{Member 4 name}]({MEMBER_4_UPPERCASE_NAME}_WEEKLY_WORK_PLAN.md)
- [{Member 5 name}]({MEMBER_5_UPPERCASE_NAME}_WEEKLY_WORK_PLAN.md)

## 2. Prior-week inputs and start conditions

- {completed baseline}
- {technical, data, or environment input}
- {accounts, permissions, or tools}
- {blocker that must be resolved before work starts}

## 3. Weekly scope

### 3.1 Must complete

- {P0 item 1}
- {P0 item 2}
- {P0 item 3}

### 3.2 Complete if capacity permits

- {non-blocking improvement}

### 3.3 Explicitly out of scope

- {later capability}
- {P1 or Post-MVP capability}
- {scope-expansion item}

## 4. Five independent work packages

| Member | Work package | Primary file ownership | Frozen input contract | Output contract | Individual verification |
|---|---|---|---|---|---|
| {Member 1} | {task} | {files or directories} | {input} | {output} | {checks} |
| {Member 2} | {task} | {files or directories} | {input} | {output} | {checks} |
| {Member 3} | {task} | {files or directories} | {input} | {output} | {checks} |
| {Member 4} | {task} | {files or directories} | {input} | {output} | {checks} |
| {Member 5} | {task} | {files or directories} | {input} | {output} | {checks} |

### PR route and integration order

| Work package | Issue branch | PR base | Entry condition for Sprint branch | Integration order |
|---|---|---|---|---|
| {Work package 1} | `{type}/{issue}-{description}` | `sprint/{N}-{theme}` | {individual acceptance, review, checks} | 1 |
| {Work package 2} | `{type}/{issue}-{description}` | `sprint/{N}-{theme}` | {conditions} | 2 |
| {Work package 3} | `{type}/{issue}-{description}` | `sprint/{N}-{theme}` | {conditions} | 3 |
| {Work package 4} | `{type}/{issue}-{description}` | `sprint/{N}-{theme}` | {conditions} | 4 |
| {Work package 5} | `{type}/{issue}-{description}` | `sprint/{N}-{theme}` | {conditions} | 5 |

Independent execution rules:

1. Each member changes only their owned file range.
2. When a dependency is unavailable, use the frozen type, mock, adapter, or fixture.
3. Do not continuously pair or make opportunistic changes in another work package.
4. Record interface changes through the shared decision process; do not change a frozen contract after a private conversation.
5. Each work package completes its own verification before the single integration checkpoint.
6. Feature owners provide the minimum unit, integration, route, and regression tests required by their Issue. The test/acceptance owner provides shared test configuration, cross-package harnesses, CI, fixtures, and Sprint-level evidence.
7. Route/page owners implement the actual UI surface. Authentication owners implement protection for the frozen route namespaces without taking ownership of those pages.

## 5. Frozen interfaces and file boundaries

| Contract or boundary | Provider | Consumers | Frozen content | Conditions for change |
|---|---|---|---|---|
| {Contract A} | {member} | {members} | {fields, function, or behavior} | {blocking reason and approval path} |
| {Contract B} | {member} | {members} | {fields, function, or behavior} | {blocking reason and approval path} |

The file owner retains edit authority for the week. A cross-boundary change request records the required change and reason; the owner implements it or explicitly hands over the file.

## 6. Three team checkpoints

### Checkpoint 1: start-of-week contract freeze

- Confirm five work packages, file ownership, input/output contracts, and real Issues.
- Confirm that every member can start independently.
- Do not schedule routine whole-team syncs after the freeze.

### Checkpoint 2: single integration

- Each work package completes individual acceptance first.
- Each work-package PR targets the Sprint branch and references exactly one primary Issue.
- Integrate in dependency order without rewriting another member's work.
- Address only interface mismatches and blocking defects.

### Checkpoint 3: end-of-week acceptance

- Perform concentrated non-author review, regression, quality checks, and weekly completion assessment.
- Open the Sprint PR to `main` using the designated integration/acceptance Issue.
- List every included work-package Issue; mark the group `Done` only after the Sprint PR merges.
- Send non-blocking suggestions to the backlog instead of repeatedly interrupting completed work packages.

## 7. Weekly deliverables

- {outputs and locations for the five work packages}
- {frozen interfaces and change records}
- {integration, test, and review evidence}
- {risks, unfinished items, and next-week inputs}

## 8. Weekly acceptance checklist

- [ ] All five work packages completed individual acceptance.
- [ ] No member overwrote another member's owned files.
- [ ] Frozen interfaces were compatible at the integration checkpoint.
- [ ] Every deliverable received one concentrated non-author review.
- [ ] Review findings were attributed to the current Issue, a frozen contract, another work package, or pre-existing behavior.
- [ ] Feature-owned verification was not confused with shared acceptance-platform ownership.
- [ ] All work-package PRs merged into the Sprint branch and their Issues remain in `Testing`.
- [ ] The Sprint PR has the correct primary Issue, included Issues, base/head, and integrated acceptance evidence.
- [ ] Lint, typecheck, tests, and build passed.
- [ ] Permission, privacy, and sensitive-data requirements passed.
- [ ] No blocking defects remain.
- [ ] The first next-week inputs are `Ready`.

## 9. Risks and responses

| Risk | Signal | Impact | Response | Owner |
|---|---|---|---|---|
| {Risk 1} | {signal} | {impact} | {action} | {member} |
| {Risk 2} | {signal} | {impact} | {action} | {member} |

## 10. Definition of Done

1. {Core objective passes acceptance.}
2. All five work packages have independent deliverables and verification evidence.
3. The single integration checkpoint and concentrated non-author review are complete.
4. Lint, typecheck, tests, and build pass.
5. Permission, privacy, and data relationships are verified.
6. No blocking issue remains.
7. Every non-blocking remainder has an owner and due date.
8. The first next-week tasks are `Ready`.
9. Only after the Sprint PR merges into `main` do the accepted Issues enter `Done`.

## 11. Unfinished-item handling

- {blocker escalation path}
- {interface-change process}
- {how non-blocking items enter the backlog}
- Do not describe an unverified result as complete.
- New requests do not replace unfinished P0 work without an approved scope decision.
