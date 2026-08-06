# 第 4 天步骤 3：仓库目录结构落实记录

> 所属计划：[第 4 天：项目骨架与开发环境搭建](../../DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> 前一步：[第 4 天步骤 2：应用骨架初始化记录](DAY_4_STEP_2_APPLICATION_SCAFFOLD.md)
> 结构基线：[第 1 天仓库结构与命名基线](../day-1/DAY_1_REPOSITORY_STRUCTURE_BASELINE.md)
> 数据交接：[第 3 天跨文档复核与实施交接](../day-3/DAY_3_STEP_8_CROSS_DOCUMENT_REVIEW.md)
> 执行日期：2026-08-06
> 状态：步骤 3 已完成

## 1. 执行结论

已按第 1 天冻结基线建立单一 Next.js 应用的路由、共享组件、业务 feature、
基础设施、公共类型、Supabase、测试和文档目录。所有尚未使用的目录均包含简短
README 或由同级 README 明确说明职责，能够被 Git 保留并供新成员理解。

本步骤只落实目录和职责边界，没有提前创建业务 `page.tsx`、Route Handler、
Supabase client、数据库 schema、RLS policy 或业务测试。生产构建仍只公开根 `/`
页面和框架生成的 `/_not-found`。

## 2. 路由与布局目录

| 区域 | 已建立目录 | 当前状态 |
|---|---|---|
| 认证 | `src/app/(auth)/login/` | 仅职责说明；未公开 `/login` |
| 后台壳层 | `src/app/(dashboard)/` | 仅职责和授权边界说明；未创建共享 layout |
| Dashboard | `src/app/(dashboard)/dashboard/` | 未公开业务页面 |
| 会议 | `meetings/`、`meetings/new/`、`meetings/[meetingId]/` | 未公开业务页面 |
| 任务 | `tasks/`、`tasks/new/`、`tasks/[taskId]/` | 未公开业务页面 |
| 活动 | `events/`、`events/new/`、`events/[eventId]/` | 未公开业务页面 |
| 报名 | `registrations/` | 已记录仅授权人员边界 |
| 签到明细 | `attendance/[eventId]/` | 已记录仅授权人员边界 |
| 晚餐核验 | `dinner-verification/[eventId]/` | 已记录仅授权人员边界 |
| 公开签到 | `check-in/[token]/` | 已记录受限 token 边界 |
| 签到 API | `api/check-in/[token]/` | 未创建 `route.ts`，当前不公开 API |

Route group 只组织文件，不视为权限控制。对应 README 明确要求未来页面、Server
Action、Route Handler 和 Supabase RLS 分别执行授权。

## 3. 应用代码目录

| 目录 | 已建立子目录 | 职责 |
|---|---|---|
| `src/components/` | `ui`、`layout`、`feedback` | 无业务 UI、共享布局和统一反馈 |
| `src/features/` | `auth`、`dashboard`、`meetings`、`tasks`、`events`、`registrations`、`attendance`、`dinner-verification` | 按 P0 领域组织查询、写操作、schema、类型和组件 |
| `src/lib/` | `auth`、`supabase`、`constants`、`dates`、`validation` | 跨领域基础设施和纯工具 |
| `src/types/` | 公共类型目录 | 数据库生成类型与少量跨领域类型 |

没有预建空的 actions、queries、schema 或组件模块；出现真实职责时才新增文件。
`src/lib/supabase/browser.ts` 和 `server.ts` 留到步骤 5 按官方 SSR 模式实现。
`src/types/database.generated.ts` 留到 migration 落地后由 Supabase CLI 生成，
不会手工创建。

## 4. Supabase 目录

已建立：

```text
supabase/
├── migrations/
├── tests/
│   ├── constraints/
│   └── rls/
├── .gitignore
├── README.md
└── seed.sql
```

- `migrations/` 是 schema、约束、函数、触发器、索引和 RLS policy 的唯一可执行
  事实来源；不建立平行 `policies/` 目录；
- `seed.sql` 当前只有安全说明，不包含数据；
- `tests/constraints/` 与 `tests/rls/` 已分别记录测试职责；
- `supabase/.gitignore` 忽略 CLI 临时状态和本地环境文件；
- `config.toml`、首个 timestamped migration 和 migration 操作说明在步骤 6
  通过锁定版本的 Supabase CLI 创建；
- 本步骤没有连接远程项目，也没有记录任何 project reference、密码或 key。

## 5. 测试目录

| 目录 | 预定内容 |
|---|---|
| `tests/unit/` | 日期边界、逾期、资格计算和纯验证函数 |
| `tests/integration/` | 组件、Server Action、Route Handler 和数据库交互 |
| `tests/e2e/` | 登录到晚餐核验的关键用户流程 |
| `tests/fixtures/` | 仅虚构数据和可复用工厂 |
| `supabase/tests/constraints/` | 唯一约束、外键和状态规则 SQL 测试 |
| `supabase/tests/rls/` | 普通委员会、授权人员和匿名会话权限 SQL 测试 |

具体测试框架和命令按计划在第 5 天选择，本步骤没有提前引入测试依赖。

## 6. 文档目录

现有 `docs/project/`、`docs/plans/` 和 `docs/templates/` 保持不变，并新增：

| 目录 | 内容 |
|---|---|
| `docs/product/` | Backlog、需求追踪、信息架构和页面流程 |
| `docs/architecture/` | 系统架构、模块边界、ERD 和数据流 |
| `docs/security/` | 权限、隐私、威胁和安全测试说明 |
| `docs/operations/` | 本地运行、部署、migration、备份和恢复 |
| `docs/decisions/` | 跨周长期有效的 ADR |

每个新增文档目录包含范围说明，且明确不记录密钥、真实环境值或真实参与者数据。

## 7. 重复用途与边界检查

- 没有拆分 `frontend/`、`backend/` 或第二个 API 项目；
- 页面组合只在 `src/app/`，领域逻辑只在 `src/features/`；
- 共享无业务组件只在 `src/components/`；
- 跨领域基础设施只在 `src/lib/`；
- 数据库可执行变更只在 `supabase/migrations/`；
- RLS 人类可读说明放入 `docs/security/`，可执行 policy 仍进入 migration，
  权限测试进入 `supabase/tests/rls/`；
- 应用测试与数据库测试位置不同，不存在重复测试目录；
- 未新增未批准的 ORM、第二套 migration 工具或第二个样式框架。

## 8. 验证结果

| 检查 | 结果 |
|---|---|
| 45 个要求目录逐项存在检查 | 通过 |
| 当前公开特殊路由文件检查 | 仅根 `layout.tsx` 与根 `page.tsx` |
| `npm run lint` | 通过 |
| `npm exec tsc -- --noEmit` | 通过 |
| `npm run build` | 通过 |
| 生产路由输出 | 仅 `/` 和 `/_not-found` |
| 数据库业务 SQL 检查 | 无 schema、RLS 或真实 seed data |

## 9. 步骤 3 验收清单

- [x] 已建立已批准的路由和布局目录；
- [x] 已建立共享 UI 组件目录；
- [x] 已建立业务模块、服务端逻辑预留、工具函数和类型目录；
- [x] 已建立 Supabase migration、seed 和数据库策略测试目录；
- [x] 已建立应用测试和测试辅助目录；
- [x] 已建立产品、架构、安全、运行和决策文档目录；
- [x] 尚未使用的目录均有简短职责说明；
- [x] 已核对实际目录与第 1 天批准结构；
- [x] 代码、数据库、测试和文档不存在重复用途目录；
- [x] 未提前实现业务功能、数据库 schema 或权限策略。

步骤 3 已完成。步骤 4 可以在此结构上配置环境变量名称、安全忽略规则和说明。
