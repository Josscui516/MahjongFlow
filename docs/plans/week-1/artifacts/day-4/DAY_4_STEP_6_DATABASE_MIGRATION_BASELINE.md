# 第 4 天步骤 6：数据库迁移基线记录

> 所属计划：[第 4 天：项目骨架与开发环境搭建](../../DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> 前一步：[第 4 天步骤 5：Supabase 开发环境连接记录](DAY_4_STEP_5_SUPABASE_CONNECTION.md)
> 设计输入：[第 3 天迁移实施顺序与匿名化种子方案](../day-3/DAY_3_STEP_7_MIGRATION_AND_ANONYMISED_SEED_PLAN.md)
> 操作指南：[数据库迁移操作](../../../../operations/DATABASE_MIGRATIONS.md)
> 执行日期：2026-08-06
> 状态：步骤 6 已完成；本地空 migration 基线可重放

## 1. 执行结论

已使用 Supabase CLI 初始化本地项目配置，通过 CLI 生成真实 UTC timestamped 空基线
migration，并在 Docker 本地 Supabase 栈完成启动、无 seed 重建、migration history、
database lint、schema diff 和只读范围查询。

本步骤没有连接或修改远程数据库，没有创建业务表、自定义类型、RLS policy、Auth
fixture 或 seed data。第 2 周的三组业务 migration 仍按第 3 天已批准顺序另行创建和
审查。

## 2. 锁定工具与配置

| 项目 | 基线 |
|---|---|
| Supabase CLI | `2.111.0`，精确锁定在 `devDependencies` 和 `package-lock.json` |
| 调用方式 | npm scripts 或 `npm exec supabase -- ...`，不依赖全局安装 |
| Docker Engine | `29.6.2` |
| Local PostgreSQL | 配置为 major version `17`；首次启动镜像为 PostgreSQL `17.6.1.156` |
| Data API exposure | 新对象默认不自动授权；未来 exposed table 仍须显式 grant 与 RLS |
| Seed entry | `supabase/seed.sql`；当前只有安全说明，不创建数据 |

`supabase/config.toml` 由锁定 CLI 生成，只包含可提交的本地配置和 `env(...)` 引用，
不包含远程项目 URL、数据库密码、access token 或应用环境值。Auth 本地 redirect 与
Next.js 的 `http://localhost:3000` 对齐。

## 3. Migration 基线

CLI 创建：

```text
supabase/migrations/20260806022624_establish_empty_baseline.sql
```

该文件只有职责与边界注释，刻意执行零 schema、data、role、grant、Auth 和 RLS
变更。它用于证明真实时间戳命名、顺序重放和 review 工作流已经可用，不得在第 2 周
把业务 SQL 追加进此文件。

未来 migration 必须使用：

```text
npm run db:migration:new -- lower_snake_case_name
```

文件格式由 CLI 生成：

```text
YYYYMMDDHHMMSS_lower_snake_case_name.sql
```

禁止手写时间戳、修改已共享 migration 历史，或只在 Dashboard 修改 schema／policy。

## 4. 已建立的本地命令

| npm script | 作用 |
|---|---|
| `db:start` | 启动本地 Supabase Docker 栈 |
| `db:stop` | 停止本地栈并保留本地 volume |
| `db:reset` | 重建本地库、重放 migration 并运行已配置 seed |
| `db:reset:no-seed` | 重建本地库并只验证 migration |
| `db:migrations` | 列出本地 migration 文件与 history |
| `db:migration:new` | 通过 CLI 创建真实 timestamped migration |
| `db:lint` | 以 error 为失败阈值检查本地数据库 |
| `db:diff` | 检查 migration 与本地 schema 漂移 |

这些 scripts 故意不包含 `link`、`--linked`、远程 `--db-url`、`db push`、repair、
远程 reset 或 restore。远程数据库状态变更仍需要用户明确授权。

## 5. 当前业务 Migration 顺序

第 2 周实施时必须使用 CLI 依次创建：

1. `create_mvp_types_and_tables`；
2. `add_mvp_constraints_indexes_and_triggers`；
3. `add_mvp_rls_helpers_policies_and_rpcs`。

第一组建表时必须立即启用 RLS，使 policy 建立前保持默认拒绝。三组 migration 应作为
同一数据库基础任务审查，不能长期只部署表而遗漏约束、索引、grant 或 policy。

## 6. 回滚与恢复规则

- 未共享、未部署的 migration：确认无人依赖后可本地修正，并从空库完整 reset；
- 已共享或部署的 migration：不得改写、重命名或删除，使用新的补偿 migration；
- 逆序考虑 policy/grant、RPC/helper、trigger/index/constraint、child table、parent
  table、type/extension；
- 删列、类型收窄和数据变换必须先提供备份、恢复与不可逆影响说明；
- linked reset、remote rollback、repair、push 和 restore 都是独立的远程写操作，必须
  明确授权并复核环境。

## 7. 验证结果

| 检查 | 结果 |
|---|---|
| `supabase --version` | `2.111.0` |
| Docker daemon | 可用；Engine `29.6.2` |
| `npm run db:start` | 通过；本地 Postgres、Auth、REST 等服务健康启动 |
| 首次启动自动应用 migration | 通过 |
| `npm run db:reset:no-seed` | 通过；空库重建并重放基线 |
| `npm run db:migrations` | 本地文件与 history 均为同一个 `20260806022624` version |
| `npm run db:lint` | 通过；0 schema errors |
| `npm run db:diff` | 通过；无 schema changes／未记录漂移 |
| 只读范围查询 | `public` 自建 table 为 0，自定义 type 为 0 |
| `npm run db:stop` | 通过；本地 Supabase 容器已停止 |
| `npm audit` | 0 vulnerabilities |

Supabase CLI 启动时会在终端显示本地 Docker 开发凭据。本次没有将这些本地生成值
复制进文档、配置、日志 artifact 或应用环境文件；远程开发项目凭据也未用于本地
database reset。

## 8. 步骤 6 验收清单

- [x] 已初始化 `supabase/config.toml`；
- [x] 已按第 3 天方案落实 CLI 生成的 timestamped 命名规则；
- [x] 已创建零 schema 变更的首个空基线 migration；
- [x] 已记录第 2 周类型／表 → 约束／索引／触发器 → helper／RLS／RPC 顺序；
- [x] 已记录 start、reset、migration list、lint 和 diff 本地流程；
- [x] migration 文件和配置位于可版本管理路径；
- [x] 已记录未发布与已发布 migration 的回滚边界；
- [x] 本地空库可成功重放基线且无漂移；
- [x] 未提前实现业务 schema、RLS、Auth fixture 或 seed；
- [x] 未执行任何远程数据库写操作。

步骤 6 已完成。步骤 7 仍等待 Vercel 项目创建权限，不影响当前 Supabase 本地迁移
基线的可复现性。
