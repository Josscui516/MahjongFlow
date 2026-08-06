---
name: mahjongflow-development
description: Design, implement, test, review, or document MahjongFlow features while enforcing the approved MVP scope, module boundaries, current Next.js guidance, Supabase migrations and RLS, committee versus authorised access, participant-data minimisation, Sydney date semantics, UI state coverage, and risk-proportionate validation. Use for changes to src/, supabase/, tests/, application or architecture docs, authentication, meetings, tasks, events, registration, attendance, check-in, dinner verification, Dashboard behavior, or database and permission design.
---

# MahjongFlow Development

Use repository documents as the source of truth. Read `../../../AGENTS.md` and `../../../README.md` first. Use `$project-delivery-workflow` when the task involves GitHub Issues, Git, PRs, Project status, or handoff.

## Route to authority

| Change | Read before acting |
|---|---|
| Scope, roles, requirements, acceptance, roadmap | `../../../docs/project/MVP_PROJECT_PROPOSAL.md` |
| Module layout, imports, naming, test locations | `../../../docs/plans/week-1/artifacts/day-1/DAY_1_REPOSITORY_STRUCTURE_BASELINE.md` |
| Permission or sensitive data | `../../../docs/plans/week-1/artifacts/day-3/DAY_3_STEP_5_PERMISSION_MATRIX_AND_CONTROL_POINTS.md` and directly linked security documents |
| Schema, migration, RLS, generated types, rollback | `../../../docs/operations/DATABASE_MIGRATIONS.md` |
| Environment or deployment | `../../../docs/operations/ENVIRONMENT_CONFIGURATION.md`, `../../../docs/operations/VERCEL_DEPLOYMENT.md` |
| Issue acceptance and dependencies | The linked GitHub Issue and its parent Epic |

For Next.js changes, locate the installed package and read the applicable topic in `node_modules/next/dist/docs/` before coding. Follow that version's conventions and deprecation notices.

## Protect scope and data

1. Map the request to a real P0, P1, or Post-MVP ID and linked Issue. Keep unapproved new capability in Post-MVP.
2. Preserve the role model: committee users access non-sensitive coordination data and safe aggregates; only `authorised` users access participant, registration, attendance, and dinner-verification details; anonymous participants receive only the minimum token-scoped operation.
3. Enforce protected access at every applicable layer: route or UI visibility, server handler, and Supabase RLS. UI hiding never counts as authorisation.
4. Collect and expose only fields approved by the MVP. Use fictional or anonymised data in code, seeds, tests, docs, screenshots, and demos.
5. Keep secrets server-side. Never expose a secret/service-role client or full sensitive-record type to a Client Component.

## Shape implementation deliberately

Before materially changing code, classify each changed unit as immutable data, pure domain function, stateful application service, or side-effect adapter.

1. Keep validation, status derivation, progress calculation, overdue logic, dinner eligibility, mapping, and projection pure where practical.
2. Keep Supabase calls, authentication, clocks, token generation, logging, and other I/O behind narrow server-side boundaries.
3. Prefer small modules, composition, explicit parameters, and dependency injection. Use classes only when state, lifecycle, or resource ownership makes them clearer; use inheritance only for genuinely substitutable contracts.
4. Keep `components/ui/` free of feature data access, keep `lib/` independent of pages, and prevent features from importing another feature's internals.
5. Avoid global mutable state, service locators, unbounded common dictionaries, deep inheritance, and speculative frameworks.
6. Do not create empty structure or abstractions before an actual responsibility or second use case exists.
7. Use `Australia/Sydney` semantics for dates, due-soon, overdue, event windows, and day-boundary tests.

## Change Supabase safely

For schema, relationship, authentication, RLS, participant, attendance, or check-in-token changes:

1. Add a timestamped SQL migration; never make Dashboard-only changes.
2. Define and explain applicable foreign keys, unique constraints, check constraints, and indexes.
3. Add or update default-deny RLS policies and test allowed and denied committee, authorised, and anonymous paths.
4. Document rollback or, if irreversible, backup and recovery steps plus deployment order and existing-data impact.
5. Keep seed data fictional and repeatable.
6. Regenerate `src/types/database.generated.ts`; never edit it manually.

## Verify behavior

1. Derive tests from the linked Issue's acceptance scenario IDs rather than only from implementation details.
2. Cover success and applicable loading, empty, validation-error, permission-denied, duplicate-submit, and system-error behavior.
3. Add unit tests for pure rules, integration tests for server and persistence boundaries, database tests for constraints and RLS, and end-to-end tests for critical user flows when the repository supports them.
4. For a bug fix, add a regression that demonstrates the failure and the corrected behavior.
5. Run only repository-supported commands. At minimum consider `npm run lint`, `npm exec tsc -- --noEmit`, `npm run build`, and applicable database or test commands; report every check not run and why.
6. Review the final diff for scope expansion, missing permission layers, sensitive-data exposure, duplicate facts, stale generated types, implicit side effects, unhandled UI states, and unrelated changes.

## Completion check

Confirm that the implementation satisfies the linked acceptance scenarios without expanding MVP scope; protected paths have explicit allow and deny coverage; migrations, RLS, rollback, seed, deployment, and generated-type effects are complete when applicable; Sydney date boundaries and UI states are covered; current Next.js documentation was followed; and remaining risks or assumptions are stated.
