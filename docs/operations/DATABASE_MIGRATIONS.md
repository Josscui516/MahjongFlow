# Database migration operations

> Implementation source: [Day 3 migration and anonymised seed plan](../plans/week-1/artifacts/day-3/DAY_3_STEP_7_MIGRATION_AND_ANONYMISED_SEED_PLAN.md)
> Project setup: [Root README](../../README.md)
> Last checked: 2026-08-06 with Supabase CLI `2.111.0`

## 1. Source of truth

All schema, type, table, constraint, index, trigger, function, grant and RLS changes must be
represented by timestamped SQL in `supabase/migrations/`. Dashboard-only changes are prohibited
because they create unreviewed environment drift.

Day 4 的首个 migration 是历史空基线。当前仓库已有 14 个 timestamped migrations，覆盖 MVP 表／约束／RLS、会议原子写入、账号管理、受保护删除、参与者名称校验、活动 token 管理、分布式限速及用户确认的公开报名／独立晚餐名册及 Task 与 Meeting 多对多关联。顺序以 `supabase/migrations/` 为准；Sprint 8 没有 schema 或生成类型改动。2026-10-04 本地需求纠正的部署顺序、已有数据边界及回退见[需求决定](../project/REGISTRATION_AND_DINNER_CORRECTION.md)。

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
- `--no-seed` 不载入虚构 seed，但仍建立全部当前业务 schema／RLS；常规带 seed 的 reset 会载入虚构开发数据，不得对已有工作数据做例行 reset。

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

## 7. 会议删除 migration 部署与回退

`20260821060847_add_meeting_delete_boundary.sql` 增加仅后台用户可执行的窄函数
`delete_meeting_record(uuid)`。函数删除会议主记录，并依赖既有外键级联删除参会关系、
讨论点和关键决策；如果已有任务引用该会议，则返回 `linked_tasks` 并保留全部记录。
应用代码必须在 migration 应用并重新生成数据库类型后发布。该 migration 不转换或
删除已有数据，也不向 `authenticated` 授予会议表的直接 `DELETE` 权限。

回退时先撤下应用中的删除入口，再通过新的前向 migration 撤销
`delete_meeting_record(uuid)` 的执行权限并删除该函数，同时恢复上一版
`prevent_last_meeting_attendee_delete()`。已经通过该功能删除的会议无法通过 schema
回退恢复；上线前必须确认数据库备份和恢复流程可用，发生误删时只能从删除前备份恢复。

## 8. 任务删除 migration 部署与回退

`20260827003049_add_task_delete_boundary.sql` 增加仅后台用户可执行的窄函数
`delete_task_record(uuid)`。函数只删除目标任务；若任务来自会议决策或讨论点，来源会议
和议程记录继续保留。应用代码必须在 migration 应用并重新生成数据库类型后发布。
该 migration 不转换或删除已有数据，也不向 `authenticated` 授予 `tasks` 表的直接
`DELETE` 权限。

回退时先撤下应用中的任务删除入口，再通过新的前向 migration 撤销
`delete_task_record(uuid)` 的执行权限并删除该函数。已经删除的任务无法通过 schema
回退恢复；上线前必须确认备份和恢复流程可用，误删只能从删除前备份恢复。

## 9. Sprint 7 活动签到 token 管理 migration 部署与回退

`20260916000100_secure_event_check_in_token_management.sql` 在既有 token 表、摘要约束和
原子轮换函数之上增加三项窄边界：读取非秘密状态、配置活动签到窗口和显式撤销当前
token。所有函数只向 `service_role` 授权，并在函数内再次验证操作者是有效的
`authorised` profile；浏览器中的 `anon`／`authenticated` 角色不能执行。轮换函数同时
收紧为只允许已配置有效窗口的 `scheduled` 活动，并继续在一个事务中撤销旧 token、
生成 32 个随机字节、只保存 SHA-256 摘要和返回一次明文。

部署顺序为先应用 migration，再发布引用这些 RPC 的应用代码，并确认 server-only
`SUPABASE_SECRET_KEY` 与 `APP_BASE_URL` 已配置。该 migration 不重写现有 token 或活动
数据；既有活动需先通过授权界面配置窗口，才能生成新 QR。

回退时先撤下 token 管理界面和 Server Actions，再用新的前向 migration 撤销三个新增
函数的执行权并删除 `get_event_check_in_token_status`、
`configure_event_check_in_window` 和 `revoke_event_check_in_token`；如需恢复旧轮换语义，
在同一前向 migration 中重建上一版本 `rotate_event_check_in_token`。已经轮换或撤销的
明文 token 无法恢复，回退前应撤销所有公开入口并通知现场人员重新生成链接。活动窗口
和 token 审计行应保留，不通过回退删除历史记录。

## 10. Sprint 7 分布式签到限速部署与回退

`20260927032601_add_atomic_self_check_in_rate_limit_after_token_management.sql`
必须在上述 token 管理 migration 之后执行。它新增 `private.check_in_rate_limits`
及只向 `service_role` 开放的 `consume_check_in_rate_limit`，以事务更新跨实例请求计数；
不修改参与者、报名或签到行。来源指纹由应用生成不可逆摘要，不记录原始 IP、token
或提交身份。重新生成 `public,graphql_public` 类型后，应用直接使用生成的 RPC 契约。

上线先核对两项 migration 顺序、函数权限和生产服务端配置，再部署应用。
回退先撤下公开签到页面/API，并撤销 `submit_event_check_in` 和
`consume_check_in_rate_limit` 的 `service_role` 执行权限；随后按需要以新的前向
migration 删除限速函数和私有计数表。不得删除 `attendance_records`、活动窗口或
token 审计历史，不恢复已撤销的明文链接。2026-09-30 在隔离本地库以事务模拟撤销
两项执行权，逐行比较签到数据不变，再 rollback 恢复权限；证据见
[Sprint 7 验收记录](../plans/week-7/QR_CHECK_IN_DINNER_ACCEPTANCE_RECORD.md)。

## 11. 2026-09-30 当前核验边界

本轮核对仓库 12 个 migration 文件与 Sprint 8 的无 schema 变更合同；未读取 Supabase 远程 migration history、未运行远程 reset／push。此前隔离栈顺序、447 SQL 断言、并发、schema lint／diff 和恢复结果见[M5 验收](../plans/week-8/MVP_INTERNAL_ACCEPTANCE_RECORD.md)。虚构数据维护见[清理 runbook](FICTIONAL_ACTIVITY_DATA_CLEANUP.md)，不以 Git revert 代替数据恢复。
