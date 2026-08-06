# Supabase workspace

此目录是数据库 migration、虚构 seed data 和数据库测试的唯一仓库位置。当前锁定
Supabase CLI `2.111.0`，由项目 `devDependencies` 和 lockfile 管理；团队统一通过 npm
scripts 或 `npm exec supabase -- ...` 调用，不依赖全局 CLI。

## 目录职责

| 路径 | 职责 |
|---|---|
| `config.toml` | 本地 Supabase 配置；只能包含可提交的非秘密设置 |
| `migrations/` | timestamped SQL；schema、约束、函数、触发器、索引、grant 和 RLS 的唯一可执行事实来源 |
| `seed.sql` | 本地 seed 入口；只允许虚构或匿名化数据 |
| `tests/constraints/` | 主外键、唯一、检查、状态和派生规则测试 |
| `tests/rls/` | committee、authorised 和 anonymous 会话的允许／拒绝测试 |

不得只在 Supabase Dashboard 修改远程 schema 或 policy。`.env*`、CLI 临时状态、
密码、token、真实参与者资料和远程数据库 dump 均不得提交。

## 初始化与日常本地流程

先安装项目依赖并确保 Docker Desktop／Docker Engine 正常运行：

```text
npm ci
npm run db:start
npm run db:reset:no-seed
npm run db:migrations
npm run db:lint
npm run db:diff
```

`db:reset:no-seed` 会重建本地数据库并按时间戳顺序重放 migration；它是验证 schema
不依赖 seed 的标准入口。`db:diff` 在干净 reset 后不应报告未记录的 schema 漂移。

停止本地服务：

```text
npm run db:stop
```

这些命令只针对本地 Docker 环境。不要把 `--linked`、`--db-url`、`db push`、远程
reset 或 migration repair 加入普通 npm scripts；任何远程数据库变更都需要单独授权。

## 创建 migration

必须让 CLI 生成时间戳，不得手写或预估文件名：

```text
npm run db:migration:new -- create_descriptive_object
```

名称使用小写 `snake_case`，生成格式为：

```text
supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql
```

当前 `establish_empty_baseline` 是 Day 4 的零 schema 变更基线。第 2 周按已批准顺序
另行创建：

1. `create_mvp_types_and_tables`；
2. `add_mvp_constraints_indexes_and_triggers`；
3. `add_mvp_rls_helpers_policies_and_rpcs`。

建表 migration 必须立即为所有 exposed schema 表启用 RLS；grant、policy、约束、
索引、回滚和角色测试必须随对应数据库任务审查。不得把业务 SQL 追加到 Day 4 的
空基线文件。

## Seed、测试与类型

`seed.sql` 当前只包含安全说明，不创建数据。第 2 周 seed 只能使用明确虚构资料，
不得包含可用 token、密码、session、secret 或真实个人数据。

数据库测试框架和 Auth fixture 方式将在对应计划步骤按锁定 CLI/Auth 版本确认。
在业务 migration 完成并通过 reset 后，类型应先生成到临时文件，命令成功后再替换
`src/types/database.generated.ts`，避免失败时清空已有文件。

## 回滚与恢复边界

- 尚未共享或部署的 migration 可在确认无人使用后本地修正，并从空库重新 reset；
- 已共享或部署的 migration 不得改写、重命名或删除，必须新增补偿 migration；
- 回退按 policy/grant → function/trigger/index/constraint → child table → parent table →
  type/extension 的逆依赖顺序设计；
- 删列、类型收窄、数据转换等不可逆操作必须先提供备份与恢复方案；
- `db push`、linked reset、远程 rollback、repair 或恢复必须取得明确授权。
