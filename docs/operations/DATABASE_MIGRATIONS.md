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

## 6. 账号管理 migration 部署与回退

`20260821012217_add_account_management.sql` 增加 profile 的委员会职位、独立账号管理
能力、有效状态、append-only 审计表以及四个窄管理 RPC。部署时必须先应用 migration，
再发布引用新生成类型和新 RPC 的应用代码；随后配置 server-only
`SUPABASE_SECRET_KEY`、`APP_BASE_URL` 与 Supabase Auth redirect allow-list。生产数据
升级会把当时最早创建的一个 `authorised` profile 设为初始账号管理员；部署后必须由
维护者核对该对象是否正确，再通过应用内受保护流程授权其他管理员。

已发布后不应直接删除列、类型、RPC 或审计表，因为现有 profile、会议、任务和审计
关系需要保留。回退应用时先撤下 `/admin/users` 与 Auth Admin 调用，保留新增 schema
为向后兼容状态；随后用新的前向 migration 撤销函数执行权限并冻结管理写入。只有在
确认没有新账号、角色／状态变更或审计依赖，且已备份相关表后，才能通过另一个经审查
的 migration 删除结构。账号停用不删除 profile 或历史外键记录，恢复时同时解除 Auth
ban 并把 `profiles.is_active` 恢复为 true。
