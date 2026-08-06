# Database migration operations

> Implementation source: [Day 3 migration and anonymised seed plan](../plans/week-1/artifacts/day-3/DAY_3_STEP_7_MIGRATION_AND_ANONYMISED_SEED_PLAN.md)
> Project setup: [Root README](../../README.md)
> Last checked: 2026-08-06 with Supabase CLI `2.111.0`

## 1. Source of truth

All schema, type, table, constraint, index, trigger, function, grant and RLS changes must be
represented by timestamped SQL in `supabase/migrations/`. Dashboard-only changes are prohibited
because they create unreviewed environment drift.

The Day 4 baseline is intentionally empty. It verifies the migration toolchain without introducing
Week 2 business schema.

## 2. Local commands

```text
npm ci
npm run db:start
npm run db:reset:no-seed
npm run db:migrations
npm run db:lint
npm run db:diff
npm run db:stop
```

Expected results after a clean reset:

- every local migration appears once and in timestamp order;
- database lint reports no errors;
- schema diff reports no unrecorded local drift;
- no seed, business table, custom RLS policy or real participant data exists at the Day 4 baseline.

## 3. Creating and reviewing a migration

Create files only through the locked project CLI:

```text
npm run db:migration:new -- lower_snake_case_name
```

Review the generated timestamped SQL for purpose, dependency order, constraints and indexes, RLS
and grants, lock/data impact, forward fix or rollback, seed impact, tests and generated types. After
implementation, reset a clean local database and repeat lint, database tests, diff and type generation.

## 4. Remote safety boundary

The normal workflow is local-only. Do not run `supabase link`, `db push`, `--linked`, a remote
`--db-url`, migration repair, remote reset or restore without explicit authorization and environment
verification. Never put database passwords, access tokens, project keys or `.env` values in commands,
logs, documentation, Issues or Pull Requests.

## 5. GitHub integration and production deployment

The Supabase project is connected to `Josscui516/MahjongFlow` with working directory `.` because
`supabase/` is at the repository root. `Deploy to production` is enabled for `main`. After a merge to
`main`, Supabase may apply new migration files to the connected production database automatically.
This automation does not replace migration review, local reset, lint, RLS tests, rollback planning or
generated type review.

The 2026-08-06 audit found no remote migration history yet. The repository's first migration is an
empty, comment-only baseline, so no remote schema change was introduced by the integration itself.
Before Week 2 migrations are merged, protect `main` with required Pull Requests and non-author review;
direct pushes to `main` can otherwise trigger both a Vercel Production deployment and a Supabase
production migration.

Reference: [Supabase GitHub integration](https://supabase.com/docs/guides/deployment/branching/github-integration).
