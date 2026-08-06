# 第 3 天步骤 7：迁移实施顺序与匿名化种子数据方案

> 所属计划：[第 3 天：数据库、权限与隐私设计](../../DAY_3_DATA_SECURITY_AND_PRIVACY.md)
> 隐私输入：[步骤 6：隐私字段清单与数据最小化记录](DAY_3_STEP_6_PRIVACY_FIELD_INVENTORY.md)
> 权限输入：[步骤 5：可实施权限矩阵与控制点](DAY_3_STEP_5_PERMISSION_MATRIX_AND_CONTROL_POINTS.md)
> 约束输入：[步骤 4：数据约束、状态与派生规则](DAY_3_STEP_4_CONSTRAINTS_STATES_AND_DERIVED_RULES.md)
> 仓库输入：[第 1 天仓库结构基线](../day-1/DAY_1_REPOSITORY_STRUCTURE_BASELINE.md)
> 文档核对：2026-08-04 通过 Context7 核对 Supabase CLI migration、reset、seed、lint、database test 与类型生成流程
> 状态：步骤 7 完成；本步骤未连接、重置或修改任何远程数据库

## 1. 执行结论

已规划首次数据库基线的 migration 顺序、RLS 启用顺序、函数／policy 组织方式、
本地匿名化 seed 场景、数据库测试、类型生成、验证与回滚说明。

核心决定：

- 所有 schema、类型、表、约束、索引、触发器、函数和 RLS policy 只能通过
  `supabase/migrations/` 中的 UTC timestamped SQL 管理；
- 禁止只在 Supabase Dashboard 手工修改 schema／policy；
- 建表 migration 内立即启用 RLS，随后再创建 policy，保证中间状态默认拒绝；
- 普通后台操作使用用户 JWT policy；敏感聚合和匿名签到使用步骤 5 已定义的窄
  RPC，不开放敏感底表；
- seed 只包含明确虚构资料和确定性测试关系，不包含真实人员、生产 dump、明文
  token、可用 secret 或个人账号；
- token 在测试运行时生成并在结束后撤销／清理，不进入 seed 或 fixture；
- 第 7 步只形成方案，不执行 `--linked`、`db push`、远程 reset 或 Dashboard
  变更。

## 2. 当前 Supabase CLI 基线

依据当前 Supabase CLI 文档：

| 目的 | 本地命令方向 | 本方案用途 |
|---|---|---|
| 创建 migration | `supabase migration new migration_name` | 在 `supabase/migrations/` 生成 UTC `YYYYMMDDHHMMSS_name.sql` |
| 应用待执行 migration | `supabase migration up --local` | 验证新增 migration 可在当前本地库应用 |
| 完整重建 | `supabase db reset --local` | 重建本地库、按顺序重放 migration，并运行配置的 seed |
| 不运行 seed 的重建 | `supabase db reset --local --no-seed` | 单独验证 schema／RLS 不依赖 seed |
| 查看 migration 状态 | `supabase migration list --local` | 确认本地历史与文件顺序 |
| 检查数据库问题 | `supabase db lint --local --fail-on error` | 检查函数、类型和 schema 错误 |
| 运行数据库测试 | `supabase test db` | 执行本地 pgTAP／数据库测试 |
| 检查未记录 schema 漂移 | `supabase db diff --local` | reset 后应无未纳入 migration 的手工变更 |
| 生成 TypeScript 类型 | `supabase gen types typescript --local` | 输出到 `src/types/database.generated.ts` |

实施时先运行对应 `--help` 确认团队锁定的 CLI 版本参数。所有本步骤验证使用
`--local`；不得把 `--linked`、远程 `--db-url` 或 `db push` 混入本地脚本。

官方依据：

- [Supabase CLI local development](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Managing database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Seeding the database](https://supabase.com/docs/guides/local-development/seeding-your-database)
- [Generating TypeScript types](https://supabase.com/docs/guides/api/rest/generating-types)

## 3. 文件与职责规划

| 路径 | 职责 | 是否提交 | 安全要求 |
|---|---|---:|---|
| `supabase/config.toml` | 本地 Supabase 与 seed 配置 | 是 | 只含非秘密配置；敏感值不写入 |
| `supabase/migrations/` | 有序 schema、约束、函数、索引、RLS | 是 | 文件由 CLI 生成 UTC 时间戳；不可手改已发布历史 |
| `supabase/seed.sql` | 本地 seed 入口／编排 | 是 | 仅虚构数据；可在干净 reset 后确定性运行 |
| `supabase/seeds/` | 按职责拆分的本地 seed SQL（若 config 支持多路径） | 是 | 文件名排序明确；不含 token／secret／真实资料 |
| `supabase/tests/constraints/` | 主键、外键、唯一、状态、派生规则测试 | 是 | 每项测试自行建立／回滚虚构数据 |
| `supabase/tests/rls/` | committee、authorised、anonymous 权限测试 | 是 | 使用虚构 JWT claim／fixture；不使用真实 session |
| `docs/operations/DATABASE_MIGRATIONS.md` | reset、seed、test、type、rollback 流程 | 是 | 命令默认 local；远程操作单列且需授权 |
| `src/types/database.generated.ts` | CLI 生成数据库类型 | 是 | 不手工编辑；schema 变化后重生成 |
| `tests/fixtures/` | 应用层虚构工厂／fixture | 是 | 不重复维护真实数据库 secret 或可用 token |

如果 `config.toml` 使用 `[db.seed].sql_paths` 多文件顺序，则路径按本文件第 8 节
明确排序；否则 `seed.sql` 使用 `\ir` 或等价受支持方式编排。实施时只选一种，
避免同一 seed 被执行两次。

## 4. Migration 分组与顺序

不预写未来的时间戳。实施者必须用 CLI 依次创建下列 migration，使真实 UTC
时间戳自然确定排序。

| 顺序 | migration 名称 | 主要内容 | 完成门槛 |
|---:|---|---|---|
| 1 | `create_mvp_types_and_tables` | 必要 extension、private schema、状态类型、11 个表、主外键、默认值；每个 public 表建成后立即启用 RLS | 空库可应用；无表在 API 下裸开放 |
| 2 | `add_mvp_constraints_indexes_and_triggers` | 文本／时间／状态检查、复合／部分唯一索引、来源一致性、updated_at、条件学号和人工责任触发器、policy 查询索引 | 步骤 4 全部数据库规则有承载 |
| 3 | `add_mvp_rls_helpers_policies_and_rpcs` | private role helper、table grants、RLS policy、安全聚合、token／签到窄 RPC、execute revoke／grant、固定 search_path | 步骤 5 权限矩阵和函数边界可测试 |

三个 migration 是建议的首个可审查基线，不要求把所有 SQL 塞入单一大文件。
它们必须作为同一数据库基础任务评审和部署，不能只应用建表而长期遗漏约束或
RLS。远程部署前先在干净本地环境完整 reset 和测试。

## 5. Migration 1：类型、表与默认拒绝

### 5.1 创建顺序

1. 创建 `pgcrypto` extension（用于摘要／随机能力，若本地基线尚未启用）；
2. 创建非暴露 `private` schema，并撤销不必要的 public 使用权限；
3. 创建 `committee_role`、`task_status`、`event_type`、`event_status`、
   `registration_status`、`check_in_method`、`attendance_status`；
4. 按外键拓扑创建：
   - `profiles`；
   - `meetings`；
   - `events`；
   - `participants`；
   - `meeting_attendees`；
   - `discussion_points`；
   - `meeting_decisions`；
   - `tasks`；
   - `event_check_in_tokens`；
   - `registrations`；
   - `attendance_records`；
5. 每张 public 业务表创建后立即 `ENABLE ROW LEVEL SECURITY`；
6. 明确步骤 3 的 `RESTRICT`／`CASCADE` 外键行为，不依赖数据库默认；
7. 保持此时没有宽泛 anon／authenticated policy，因此 API 默认拒绝。

### 5.2 验证

- 所有 11 个表和 7 个有限状态类型存在；
- `profiles.id` 对齐 `auth.users.id`；
- 10 个 UUID 单主键和 meeting_attendees 复合主键存在；
- 所有外键的 nullability 和删除行为与步骤 2–3 一致；
- 使用 anon／authenticated 会话直接 SELECT 任一新表均无数据权限；
- migration 不包含 seed、真实资料或 secret。

## 6. Migration 2：约束、索引与触发器

### 6.1 约束与索引顺序

1. 创建统一 `updated_at` trigger function，固定 `search_path` 并全限定对象；
2. 为可变实体安装 updated_at trigger；
3. 添加非空文本、长度、位置非负、窗口成对／先后和人工记录人检查；
4. 添加以下唯一性：
   - `participants.email`；
   - 非空 `participants.student_id`；
   - `discussion_points(meeting_id, position)`；
   - `meeting_decisions(meeting_id, position)`；
   - 非空 `tasks.source_decision_id`；
   - 非空 `tasks.source_discussion_point_id`；
   - active `event_check_in_tokens.event_id`；
   - `event_check_in_tokens.token_digest`；
   - `registrations(event_id, participant_id)`；
   - `attendance_records(event_id, participant_id)`；
5. 创建任务具体来源属于来源会议的约束触发器／可信检查函数；
6. 创建 requires_student_id 报名检查和 attendance recorded_by 条件检查；
7. 为 FK、policy 和聚合查询创建索引，至少覆盖 event、participant、assignee、
   created_by、recorded_by、状态和来源列；
8. 为所有函数撤销不必要的 PUBLIC execute，再按用途 grant。

### 6.2 验证

- 重复参与者、报名、签到和来源任务均被数据库拒绝；
- 未知状态、双来源、跨会议来源、无效窗口和匿名人工签到被拒绝；
- 修改业务记录会刷新 updated_at，客户端不能改写 created_at；
- `EXPLAIN`／测试确认 RLS helper 与聚合关键路径使用预期索引；
- 失败事务不留下半成品会议、任务、报名或签到。

## 7. Migration 3：RLS、grants 与窄函数

### 7.1 实施顺序

1. 创建 `private.is_backend_user()`、`private.is_authorised()` 等最小 helper；
2. helper 默认 invoker；确需 definer 时设置 `search_path = ''`、全限定对象并收紧
   execute；
3. 撤销 exposed tables 的宽泛 table privilege，仅授予 policy 需要的最小操作；
4. 为 profiles 创建 backend SELECT，保持角色无 app 写 policy；
5. 为会议、子项、任务、活动创建 backend SELECT／INSERT／UPDATE 与必要 D*；
6. 为 participants、registrations、attendance 创建 authorised-only policy；
7. 保持 token 表对 anon、authenticated 无直接表 policy；
8. 创建 `public.get_event_participation_totals`，固定只返回 event ID 和两个数字；
9. 创建 server-only `public.get_check_in_context`、
   `public.submit_event_check_in`、`public.rotate_event_check_in_token`；
10. 所有 definer RPC 设置空 search_path、全限定对象、revoke PUBLIC／anon／普通
    authenticated execute，仅 grant 指定调用角色；
11. 最后重新检查 anon、无 profile authenticated、committee、authorised 和
    server-only 调用矩阵。

### 7.2 验证

- committee 可读写协调数据，但直接查询三个敏感表无行／被拒绝；
- committee 聚合响应键精确为 event_id、registration_count、attendance_count；
- authorised 可读写敏感明细，但不能直接写资格或删除报名／签到；
- anon 不能直接查询或写任何业务表，也不能执行 server-only RPC；
- valid token 只能经 Next.js server-only 路径完成当前活动上下文和签到；
- 用户不能修改自己的 committee_role、created_by、recorded_by 或来源字段；
- server secret 不出现在函数定义、migration、seed 或客户端代码中。

## 8. Seed 文件顺序与执行方式

### 8.1 建议顺序

| 顺序 | seed 职责 | 内容 |
|---:|---|---|
| 1 | local Auth fixtures | 两个完全虚构的本地 Auth 用户；仅为 committee／authorised 测试 |
| 2 | profiles | 将两个固定测试 Auth UUID 映射为两种角色 |
| 3 | meetings | 一次虚构会议、参会关系、讨论点和决策 |
| 4 | events | 标准周常活动、需学号比赛、已过窗口活动 |
| 5 | tasks | 来源任务、独立逾期任务、completed 活动任务 |
| 6 | participants | Alpha／Beta／Gamma／Delta 等明确虚构参与者 |
| 7 | registrations | registered、cancelled、需学号场景 |
| 8 | attendance | confirmed QR、confirmed manual、voided 和无签到对照 |

### 8.2 Auth fixture 决策

`profiles.id` 引用 `auth.users.id`，因此本地角色 fixture 必须先存在 Auth 用户。
实施时采用以下顺序：

1. 锁定并记录本地 Supabase CLI／Auth 版本；
2. 按该版本验证官方本地 Auth fixture 方式；
3. 若使用 SQL 创建本地 Auth fixture，将其隔离在 local-only seed 文件并通过
   Auth 登录测试验证，禁止复制未经验证的内部 schema SQL；
4. 如果当前版本不提供稳定 SQL fixture 路径，则使用仓库脚本调用本地 Auth
   Admin API 创建两个用户，再运行 business seed；数据库运维文档和统一 `db:reset`
   wrapper 必须保证顺序可重复；
5. 无论采用哪种方式，都不得把真实密码、真实邮箱、access token 或远程 Auth
   用户放进 seed。

最终采用 SQL fixture 或本地 Admin API 是第 4 天安装并锁定 CLI 版本后必须验证
的实现细节，不改变 seed 场景和角色覆盖。不能为了“方便”直接猜测
`auth.users` 内部列。

### 8.3 可重复性

- 固定业务 fixture UUID，使关系和测试断言稳定；
- 所有 seed 在单一事务中按外键顺序执行；
- 对可安全重复的业务数据使用确定性 key 与 `ON CONFLICT` 策略，不产生第二行；
- `supabase db reset --local` 是标准重建入口；reset 会先清空本地数据库，再重放
  migration 和 seed；
- 不依赖 CLI 对未变化 seed 的 hash 跳过行为来保证数据正确；seed 自身仍应
  可理解、确定且不会传播真实资料；
- 相对当前时间的活动窗口可在 seed 执行时由数据库生成，但固定时钟的规则测试
  不依赖这些动态值；
- 任何 token、session、密码重置链接和 server secret 都不能写入 seed。

## 9. 匿名化种子数据场景

### 9.1 后台角色

| Fixture ID | 虚构显示名 | 虚构邮箱方向 | 角色 | 覆盖用途 |
|---|---|---|---|---|
| `profile_committee` | Committee Tester | `committee01@example.test` | committee | 协调数据成功；敏感明细拒绝；安全聚合成功 |
| `profile_authorised` | Authorised Tester | `authorised01@example.test` | authorised | 敏感明细、报名、人工签到、资格和 token 操作 |

邮箱使用保留测试域名，不对应真实收件人。登录密码不写在本文件、seed 或 Git；
本地 Auth fixture 通过受控测试配置建立。

### 9.2 会议与任务

| Fixture ID | 场景 | 关键关系 | 验收用途 |
|---|---|---|---|
| `meeting_planning` | 虚构活动筹备会议 | 两个角色参会；一个讨论点；一个决策 | 会议保存／排序／权限 |
| `task_from_decision` | 从决策转换的未开始任务 | source meeting + decision；committee 负责人 | 来源追踪、重复转换唯一性 |
| `task_overdue` | 昨日到期且未完成的独立任务 | authorised 负责人 | Sydney Overdue |
| `task_due_soon` | 未来 7 日内未完成任务 | committee 负责人 | Due soon |
| `task_completed_event` | 已完成活动筹备任务 | 关联标准活动 | 活动进度分子 |
| `task_open_event` | 未完成活动筹备任务 | 关联标准活动 | 活动进度分母 |

任务日期使用相对 seed 执行日的安全测试日期；日期边界单元／数据库测试使用
固定时钟，不把 seed 当作唯一边界证据。

### 9.3 活动

| Fixture ID | 类型／配置 | 窗口 | 用途 |
|---|---|---|---|
| `event_standard_open` | Weekly Session；不要求 student ID；scheduled | 当前时间前后形成开放窗口 | 聚合、报名、QR 成功、活动进度 |
| `event_requires_id` | Tournament；要求虚构 student ID；scheduled | 开放窗口 | 条件字段成功／失败 |
| `event_expired` | Weekly Session；scheduled | 已结束窗口 | 过期 token／签到拒绝 |
| `event_cancelled` | Tournament；cancelled | 配置窗口但状态不可签到 | 活动状态拒绝 |

seed 不创建可用 token。涉及 valid、invalid、revoked、expired 和跨活动 token 的
测试由运行时工厂调用窄 RPC 创建，并在测试结束后撤销／清理。

### 9.4 参与者、报名与签到

| Fixture ID | 虚构资料方向 | 报名 | 签到 | 覆盖结果 |
|---|---|---|---|---|
| `participant_alpha` | Participant Alpha；`alpha@example.test`；无学号 | standard registered | confirmed QR | Eligible；重复签到 |
| `participant_beta` | Participant Beta；`beta@example.test`；无学号 | standard registered | 无 | Not Eligible Yet |
| `participant_gamma` | Participant Gamma；`gamma@example.test`；无学号 | standard cancelled | 无 | 取消报名；QR 拒绝 |
| `participant_delta` | Participant Delta；`delta@example.test`；无学号 | 无 | confirmed manual | 授权现场例外；不改变报名数 |
| `participant_epsilon` | Participant Epsilon；`epsilon@example.test`；`TEST-0001` | requires-id registered | confirmed 后 voided fixture | 条件学号、人工更正、资格重算 |

所有名称、邮箱和学号均为虚构值。seed 不使用真实姓名的轻微改写、真实邮箱散列、
生产 ID、真实活动报名或真实签到状态。

## 10. 场景覆盖矩阵

| 场景类别 | 静态 seed／运行时数据 | 验证目标 |
|---|---|---|
| 成功 | 两角色、会议、来源任务、两类活动、registered、confirmed | 正常页面、关系、聚合和资格 |
| 验证失败 | requires-id 活动 + 无 student ID 的运行时参与者 | 条件字段拒绝，无半成品 |
| 重复 | 已有来源任务、报名和签到 | 三类唯一约束与幂等响应 |
| 无权限 | committee + 敏感 fixture；anonymous + 全部表 | RLS 与服务端拒绝 |
| token 无效 | 运行时随机无效、撤销、过期、跨活动 token | 统一错误且无写入 |
| 人工更正 | manual／voided 签到 | recorded_by、updated_at、资格重算 |
| 聚合隔离 | standard 活动含多种报名／签到状态 | committee 只见两个数字，无个人字段 |
| 日期边界 | 相对 seed + 固定时钟测试数据 | overdue、due soon、upcoming |

静态 seed 为演示和基础开发提供可读场景；破坏性、并发、token 和精确边界测试
应在测试事务中创建数据并回滚，避免让 seed 变成无法维护的全量测试数据库。

## 11. Seed 安全检查

seed 提交前必须执行：

1. 搜索 `.env`、secret／service-role key、JWT、密码、session、完整 URL token；
2. 搜索非 `example.test`／明确批准测试域名的 email；
3. 搜索疑似真实 student ID、电话号码、生日、住址和付款资料；
4. 检查姓名均为明确测试标签，不对应团队或参与者；
5. 检查 token 表没有可用明文 token，测试 token 只在运行时内存存在；
6. 检查演示截图和仓库文档不复制 URL 地址栏中的 token；
7. 由非作者复核 seed 数据最小化与角色覆盖。

发现疑似真实凭据或个人数据时停止传播，不在 Issue／PR／日志中复述，立即评估
删除范围并轮换可能泄漏的凭据。删除文件不代表凭据恢复安全。

## 12. 本地验证顺序

### 12.1 Schema 无 seed 验证

```text
supabase start
supabase db reset --local --no-seed
supabase migration list --local
supabase db lint --local --fail-on error
supabase test db
supabase db diff --local
```

通过标准：migration 全部成功；lint 无 error；约束／RLS 测试通过；没有手工
schema 漂移；匿名和无 profile 会话默认拒绝。

### 12.2 完整 seed 验证

```text
supabase db reset --local
supabase migration list --local
supabase test db
supabase gen types typescript --local
```

类型命令的 stdout 写入 `src/types/database.generated.ts`；实施脚本必须以临时
文件生成并在成功后替换目标，避免失败时清空已有类型文件。生成后运行 Git
diff，确认只有与本次 schema 相关的类型变化。

### 12.3 应用层验证

- committee 登录并读取协调数据和聚合数字；
- committee 直接访问 PG-14–16、敏感 Route Handler 和敏感表均被拒绝；
- authorised 可管理报名、人工签到和实时资格；
- valid token 可完成一次虚构参与者签到，重复请求不增加行；
- invalid／revoked／expired／cross-event token 返回统一错误；
- 网络响应、server logs、cache 和生成类型中无 secret 或 seed 明文 token；
- reset 后同一 fixture 关系和预期计数保持稳定。

## 13. 数据库测试文件规划

| 位置 | 建议测试文件 | 覆盖 |
|---|---|---|
| `supabase/tests/constraints/` | `01_primary_and_foreign_keys.sql` | 主外键、删除行为 |
| 同上 | `02_states_and_text_checks.sql` | 状态、非空、长度、窗口 |
| 同上 | `03_task_source_constraints.sql` | 单一来源、同会议、重复转换 |
| 同上 | `04_registration_attendance_uniqueness.sql` | 报名／签到唯一与人工责任 |
| 同上 | `05_derived_rules.sql` | Overdue、Due soon、进度、资格 |
| `supabase/tests/rls/` | `01_backend_coordination_access.sql` | committee／authorised 共享资源 |
| 同上 | `02_sensitive_data_isolation.sql` | committee／anon 无个人明细 |
| 同上 | `03_safe_aggregates.sql` | 固定返回字段与计数口径 |
| 同上 | `04_token_and_check_in_functions.sql` | execute grants、token、窗口、重复 |
| 同上 | `05_role_escalation_and_audit.sql` | 禁止自提权和审计字段伪造 |

测试文件仅描述建议职责；第 5 天确定测试框架后，再使用 CLI 的实际测试生成／
运行方式创建文件。不得在本步骤伪造“测试已通过”。

## 14. 回滚与恢复说明要求

### 14.1 开发中未发布 migration

- 只在本地使用 `migration down`／按前一 migration version reset 的当前 CLI
  支持方式验证回退，再从空库完整 reset；
- 如 migration 尚未被他人或远程应用，可修正其 SQL，但必须先确认共享状态；
- 不使用 `git reset --hard`、手工 Dashboard 回退或删除他人 migration。

### 14.2 已发布 migration

- 不改写、重命名或删除已发布 timestamped migration；
- 通过新的补偿 migration 前向修复；
- 涉及删列、类型收窄、不可逆变换或个人数据清理前先生成并验证受控备份／恢复
  方案；
- 回滚说明按依赖逆序处理：policy／grants → RPC／helper → trigger／index／
  constraint → child table → parent table → enum／extension；
- 回滚不得恢复已按隐私政策合法删除的个人数据，除非批准的备份恢复流程明确
  要求且仍在保留期内；
- 任何 linked reset、远程 rollback、db push 或恢复都需要用户明确授权和环境
  复核。

### 14.3 每个 migration 的说明模板内容

每个 migration 的 PR／数据库运维文档记录：

- migration 名称和目的；
- 依赖与预期应用顺序；
- 新增／变更对象；
- 数据回填及锁影响；
- RLS、角色、匿名入口和敏感字段影响；
- 向前修复／回退步骤；
- 不可逆项及备份恢复前提；
- 实际运行的 local reset、lint、test、diff 和 type generation 结果。

## 15. Day 4 与开发第 2 周交接

### Day 4 只需完成

- 初始化并提交 `supabase/config.toml`、`migrations/`、seed／tests 目录职责；
- 锁定并记录 Supabase CLI 本地版本；
- 验证本地 Supabase 可启动和空 migration 基线可运行；
- 提供 `.env.example` 变量名和无效说明，不写真实值；
- 不因搭建环境提前手工创建本文件中的远程 schema／policy。

### 开发第 2 周数据库基础任务完成

- 使用 CLI 创建并实现本文件第 4 节的三个 migration；
- 完成匿名化 seed 与 Auth fixture 方式验证；
- 完成 constraints／RLS tests、local reset、lint、diff 和生成类型；
- 按 Git 协议关联真实 Issue，经审查后才 push／创建 PR／部署；
- migration、RLS、回滚说明、seed、测试与
  `src/types/database.generated.ts` 必须同一任务交付。

## 16. 尚待确认但不阻塞本步骤的事项

| 事项 | 决定时间 | 影响 | 当前安全默认 |
|---|---|---|---|
| Day 4 锁定的 Supabase CLI／Auth 版本 | Day 4 | Auth fixture 具体实现、CLI 参数 | 不猜测 auth.users 内部结构；先验证 local-only 方式 |
| SQL Auth fixture 或本地 Admin API | Day 4 本地验证 | 统一 reset wrapper | 两者都只使用虚构账号，不触碰远程 |
| 具体数据库测试框架配置 | Day 5 | pgTAP 文件入口与 CI | 保留 tests 目录和覆盖清单 |
| 生产敏感数据保留期限 | 上线前 Stakeholder 决定 | 清理任务、备份、隐私说明 | 不承诺永久，不虚构天数 |

这些事项不会改变实体、约束、权限或 seed 场景，因此不阻塞第 4 天项目骨架与
本地环境搭建。若 CLI／Auth 版本验证发现方案不兼容，必须更新本文件并记录原因，
不得绕过 migration 或 RLS。

## 17. 步骤 7 完成检查

- [x] 已确认数据库结构只能通过 timestamped migration 管理；
- [x] 已规划 extension、类型、表、约束、索引、触发器、函数和 RLS 顺序；
- [x] 建表时立即启用 RLS，policy 创建前保持默认拒绝；
- [x] 已规划 committee 与 authorised 两个虚构后台角色；
- [x] 已规划会议、任务、两类活动、报名、签到和资格场景；
- [x] 所有姓名、邮箱和 student ID 均为明确虚构值；
- [x] seed 不包含明文 token、secret、真实密码或生产数据；
- [x] 成功、失败、重复、并发、无权限和 token 场景均有数据来源；
- [x] 已记录 local reset、migration list、lint、test、diff 和类型生成验证顺序；
- [x] 已记录未发布与已发布 migration 的回滚／前向修复规则；
- [x] 已明确 Day 4 与开发第 2 周的交接边界；
- [x] 本步骤未执行任何远程数据库写入、reset、push 或 Dashboard 修改。
