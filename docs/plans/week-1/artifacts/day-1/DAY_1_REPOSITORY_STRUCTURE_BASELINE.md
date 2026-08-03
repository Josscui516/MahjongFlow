# 第 1 天仓库结构与命名基线

> 所属计划：[第 1 天：范围确认与技术基线冻结](../../DAY_1_SCOPE_AND_TECH_BASELINE.md)
> 技术输入：[第 1 天核心技术栈决策记录](DAY_1_TECH_STACK_DECISION.md)
> P0 输入：[第 1 天 P0 功能范围清单](DAY_1_P0_SCOPE_CHECKLIST.md)
> 决策日期：2026-08-03
> 状态：结构基线已冻结；目录在第 4 天初始化时创建

## 1. 核心结构决策

- 使用单一 Next.js App Router 应用仓库；
- 不拆分 `frontend/`、`backend/` 或第二个 API 服务；
- 应用代码统一放入 `src/`，静态资源放入 `public/`；
- 路由只由 `src/app/` 下的 Next.js 特殊文件公开；
- 业务逻辑按 P0 领域放入 `src/features/`，共享界面放入 `src/components/`；
- Supabase 配置、migration、种子数据和数据库测试统一放入 `supabase/`；
- SQL migration 是 schema、约束和 RLS policy 的唯一可执行事实来源；
- 自动化测试按单元、集成、端到端和数据库权限分区；
- 产品、架构、安全和运行文档均保存在 `docs/`。

## 2. 计划目录树

以下是第 4 天项目初始化后应形成的目标结构，不要求在本步骤提前创建空目录：

```text
MahjongFlow/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── meetings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [meetingId]/page.tsx
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [taskId]/page.tsx
│   │   │   ├── events/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [eventId]/page.tsx
│   │   │   ├── registrations/
│   │   │   │   └── page.tsx
│   │   │   ├── attendance/
│   │   │   │   └── [eventId]/page.tsx
│   │   │   └── dinner-verification/
│   │   │       └── [eventId]/page.tsx
│   │   ├── check-in/
│   │   │   └── [token]/page.tsx
│   │   ├── api/
│   │   │   └── check-in/
│   │   │       └── [token]/route.ts
│   │   ├── error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── feedback/
│   │   ├── layout/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── meetings/
│   │   ├── tasks/
│   │   ├── events/
│   │   ├── registrations/
│   │   ├── attendance/
│   │   └── dinner-verification/
│   ├── lib/
│   │   ├── auth/
│   │   ├── supabase/
│   │   │   ├── browser.ts
│   │   │   └── server.ts
│   │   ├── constants/
│   │   ├── dates/
│   │   └── validation/
│   └── types/
│       ├── database.generated.ts
│       └── domain.ts
├── public/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── YYYYMMDDHHMMSS_description.sql
│   ├── seed.sql
│   ├── tests/
│   │   ├── constraints/
│   │   └── rls/
│   ├── .gitignore
│   └── README.md
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── docs/
│   ├── project/
│   ├── plans/
│   ├── product/
│   ├── architecture/
│   ├── security/
│   ├── operations/
│   ├── decisions/
│   └── templates/
├── .env.example
├── .gitignore
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

## 3. 路由与访问边界

Next.js route group（例如 `(dashboard)`）只组织代码和共享 layout，不进入 URL。动态段使用方括号，并且只有 `page.tsx`、`route.ts` 等特殊文件建立公开路由。

| 路由区域 | URL 示例 | 访问角色 | 对应 P0 |
|---|---|---|---|
| `(auth)/login` | `/login` | 未登录用户、后台用户 | AUTH-01、AUTH-02 |
| `(dashboard)/dashboard` | `/dashboard` | 委员会成员、授权人员 | TASK-05、TASK-06、EVENT-05 |
| `(dashboard)/meetings` | `/meetings/[meetingId]` | 委员会成员、授权人员 | MEET-01 至 MEET-05、CONV-01 至 CONV-04 |
| `(dashboard)/tasks` | `/tasks/[taskId]` | 委员会成员、授权人员 | TASK-01 至 TASK-04、CONV-03 至 CONV-05 |
| `(dashboard)/events` | `/events/[eventId]` | 委员会成员、授权人员 | EVENT-01 至 EVENT-05 |
| `(dashboard)/registrations` | `/registrations` | 仅授权人员 | REG-01 至 REG-07 |
| `(dashboard)/attendance` | `/attendance/[eventId]` | 仅授权人员 | CHECKIN-05 至 CHECKIN-07 |
| `(dashboard)/dinner-verification` | `/dinner-verification/[eventId]` | 仅授权人员 | DINNER-01 至 DINNER-04 |
| `check-in/[token]` | `/check-in/[token]` | 持有效活动 token 的参与者 | CHECKIN-01 至 CHECKIN-04 |
| `api/check-in/[token]` | `/api/check-in/[token]` | 受限签到请求 | CHECKIN-02 至 CHECKIN-04 |

路由归类不构成权限控制。敏感页面的 layout、服务端操作和 Supabase RLS 必须分别执行已冻结的权限基线。

## 4. 应用代码职责

### 4.1 `src/app/`

- 只负责路由入口、layout、页面组合、加载／错误边界和 Route Handler；
- `page.tsx` 保持轻量，调用 feature 层的查询、操作或组件；
- 页面默认使用 Server Component；只有需要交互状态、事件或浏览器 API 的叶子组件使用 `'use client'`；
- 路由私有实现文件可使用 `_components/`、`_actions/` 等下划线目录，明确它们不建立 URL；
- 同一路由专用的组件和测试可以就近放置，但跨路由复用后必须移动到 `components/` 或 `features/`。

### 4.2 `src/features/`

每个业务目录对应一个 P0 领域，可按实际需要包含：

```text
feature-name/
├── actions.ts       # 服务端写操作及授权入口
├── queries.ts       # 服务端读查询
├── schemas.ts       # 输入校验 schema
├── types.ts         # 领域局部类型
├── components/      # 该领域复用组件
└── index.ts          # 经审查后才提供的公共入口
```

- 不要求为空目录预建全部文件；只有出现实际职责时才创建；
- `actions.ts` 和 `queries.ts` 必须在入口处检查会话、角色和资源权限；
- feature 可以依赖 `lib/`、`types/` 和共享 `components/ui/`；
- feature 之间不得直接读取对方内部文件，跨领域使用明确的公共函数或服务端组合层。

### 4.3 `src/components/`

| 目录 | 内容 | 禁止内容 |
|---|---|---|
| `ui/` | Button、Input、Dialog、Table 等无业务含义组件 | Supabase 查询、角色判断、业务状态计算 |
| `layout/` | 导航、页面容器、后台壳层 | 领域写操作 |
| `feedback/` | Loading、EmptyState、ErrorMessage、SuccessMessage | 特定领域数据访问 |

### 4.4 `src/lib/` 与 `src/types/`

| 位置 | 职责 |
|---|---|
| `lib/supabase/browser.ts` | 仅创建可在浏览器使用的 publishable Supabase client |
| `lib/supabase/server.ts` | 创建基于服务端 cookie 的 Supabase client；不得被 Client Component 引入 |
| `lib/auth/` | 会话、角色和资源授权帮助函数 |
| `lib/dates/` | 悉尼时区、逾期和临期计算 |
| `lib/validation/` | 可跨领域复用的基础验证 |
| `lib/constants/` | 跨领域且稳定的常量 |
| `types/database.generated.ts` | 由 Supabase CLI 生成的数据库类型，不手工修改 |
| `types/domain.ts` | 少量跨领域、非数据库生成的公共类型 |

## 5. Supabase 文件职责

| 位置 | 是否提交 | 职责与规则 |
|---|---|---|
| `supabase/config.toml` | 是 | Supabase CLI 本地项目配置；敏感值使用环境变量，不直接写入 |
| `supabase/migrations/` | 是 | 所有 schema、约束、函数、触发器、索引和 RLS policy 的有序 SQL 变更 |
| `supabase/seed.sql` | 是 | 仅包含虚构或匿名化开发数据；必须可重复运行或在 README 写明重置前置条件 |
| `supabase/tests/constraints/` | 是 | 唯一约束、外键、状态和计算相关数据库测试 |
| `supabase/tests/rls/` | 是 | 普通委员会、授权人员和匿名角色的数据库策略测试 |
| `supabase/README.md` | 是 | migration、重置、种子、类型生成和回滚说明 |
| `supabase/.env*` | 否 | 本地 Supabase 环境值和个人覆盖 |
| `.supabase/` | 否 | CLI checkout 本地状态、链接信息和运行状态 |

RLS policy 不建立第二套可执行 `policies/` 目录；policy SQL 与对应表变更一起进入 timestamped migration。人类可读权限矩阵放在 `docs/security/`，数据库验证放在 `supabase/tests/rls/`。

## 6. 测试存放规则

| 测试类型 | 位置 | 覆盖内容 | 文件后缀 |
|---|---|---|---|
| 单元测试 | `tests/unit/` | 日期边界、逾期、资格计算、纯验证函数 | `*.test.ts` |
| 组件／服务集成测试 | `tests/integration/` | 表单、Server Action／Route Handler、数据库交互 | `*.test.ts` 或 `*.test.tsx` |
| 端到端测试 | `tests/e2e/` | 登录、会议转任务、活动、报名、签到、晚餐核验 | `*.spec.ts` |
| 数据库约束测试 | `supabase/tests/constraints/` | 唯一约束、外键、状态规则 | `*.sql` |
| RLS 权限测试 | `supabase/tests/rls/` | 三类会话的允许与拒绝路径 | `*.sql` |
| 测试数据工厂／固定数据 | `tests/fixtures/` | 仅虚构数据和可复用工厂 | `*.ts`、`*.json` 或 `*.sql` |

第 5 天选择具体测试框架；本步骤只冻结职责和位置。

## 7. 文档存放规则

| 目录 | 内容 |
|---|---|
| `docs/project/` | 已批准企划书和项目级基线 |
| `docs/plans/` | 周计划、天计划及其执行产物 |
| `docs/product/` | Backlog 导出、需求追踪、信息架构和页面流程 |
| `docs/architecture/` | 系统架构、模块边界、ERD 和数据流 |
| `docs/security/` | 权限矩阵、隐私字段、威胁与安全测试说明 |
| `docs/operations/` | 本地运行、部署、迁移、备份和恢复说明 |
| `docs/decisions/` | 跨周长期有效的 ADR；Day 1 记录保留在计划产物并可在冻结后提炼为 ADR |
| `docs/templates/` | 周计划和天计划等只读模板来源 |

## 8. 命名约定

| 对象 | 约定 | 示例 |
|---|---|---|
| 普通目录和路由 segment | `kebab-case` | `dinner-verification/` |
| Next.js route group | 小写 `kebab-case` 外加圆括号 | `(dashboard)/` |
| Next.js 动态 segment | 小驼峰参数外加方括号 | `[meetingId]/` |
| Next.js 特殊文件 | 使用框架固定小写名称 | `page.tsx`、`layout.tsx`、`route.ts`、`error.tsx` |
| React 组件文件 | `PascalCase.tsx` | `TaskStatusBadge.tsx` |
| 非组件 TypeScript 文件 | `kebab-case.ts`，领域固定入口可使用表中名称 | `dinner-eligibility.ts`、`actions.ts` |
| 函数和变量 | `camelCase` | `calculateDinnerEligibility` |
| TypeScript 类型／接口 | `PascalCase` | `AttendanceRecord` |
| 常量 | `UPPER_SNAKE_CASE` | `UPCOMING_WINDOW_DAYS` |
| 数据库表、列、约束 | `snake_case` | `attendance_records`、`event_id` |
| SQL migration | UTC 时间戳 + 小写 snake_case | `20260803090000_create_profiles.sql` |
| 单元／集成测试 | 与被测职责对应的 `*.test.ts(x)` | `overdue-status.test.ts` |
| 端到端测试 | 用户流程 `*.spec.ts` | `meeting-to-task.spec.ts` |
| 计划和正式基线文档 | 现有风格的 `UPPER_SNAKE_CASE.md` | `MVP_PROJECT_PROPOSAL.md` |
| 环境变量 | `UPPER_SNAKE_CASE` | `NEXT_PUBLIC_SUPABASE_URL` |

## 9. 导入与安全边界

1. 使用 `@/*` 指向 `src/*`，避免深层相对路径；
2. Client Component 不得导入 server-only 模块、secret key 或完整敏感记录类型；
3. `components/ui/` 不得依赖 feature；feature 可以依赖共享 UI；
4. `lib/` 不得反向依赖具体页面；
5. 页面不得直接使用 secret/service-role client；
6. 所有写操作必须通过具备鉴权、校验和错误映射的服务端入口；
7. 只有 migration 可以改变数据库 schema 或 RLS；
8. 生成的数据库类型只通过 CLI 更新，不手工修补。

## 10. 禁止提交内容

- `.env`、`.env.local`、`supabase/.env*` 或其他真实环境值；
- Supabase secret/service-role key、访问 token、密码或生产配置；
- 真实参与者姓名、邮箱、学号、报名、签到或晚餐资格数据；
- `node_modules/`、`.next/`、`out/`、`dist/`、`coverage/`；
- `test-results/`、`playwright-report/`、截图和视频等测试运行产物；
- `.supabase/` 和其他机器本地 CLI 状态；
- 未脱敏数据库 dump 或生产备份；
- 操作系统、编辑器或 IDE 的个人临时文件；
- 不明来源的大型二进制文件。

允许提交不含真实值的 `.env.example`、虚构种子数据、经批准的静态资源和必要测试 fixture。

## 11. P0 模块承载检查

| P0 分组 | 代码位置 | 路由位置 | 数据库／测试位置 | 结论 |
|---|---|---|---|---|
| 认证 | `features/auth`、`lib/auth`、`lib/supabase` | `(auth)`、受保护 `(dashboard)` | migrations + RLS tests | 可承载 |
| 会议 | `features/meetings` | `(dashboard)/meetings` | migrations + unit/integration/e2e | 可承载 |
| 决策转任务 | `features/meetings`、`features/tasks` | meetings + tasks | 关系 migration + integration/e2e | 可承载 |
| 任务与 Dashboard | `features/tasks`、`features/dashboard`、`lib/dates` | tasks + dashboard | migrations + unit/integration/e2e | 可承载 |
| 活动 | `features/events` | `(dashboard)/events` | migrations + integration/e2e | 可承载 |
| 报名 | `features/registrations` | registrations | migrations + RLS/integration | 可承载 |
| 签到 | `features/attendance` | attendance + check-in + API | constraints/RLS/integration/e2e | 可承载 |
| 晚餐核验 | `features/dinner-verification` | dinner-verification | unit + RLS/integration/e2e | 可承载 |

## 12. 当前文档依据

| 主题 | 当前依据 | 本次采用的结论 |
|---|---|---|
| Next.js 项目结构 | [Next.js Project Structure](https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/02-project-structure.mdx) | 使用 `src/app`、route groups、private folders、特殊路由文件和安全 colocation |
| Next.js 页面与 layout | [Next.js Layouts and Pages](https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/03-layouts-and-pages.mdx) | `layout.tsx` 提供共享 UI，`page.tsx` 才使 segment 可访问 |
| Supabase CLI 配置 | [Supabase CLI config path](https://github.com/supabase/cli/blob/develop/apps/cli-go/pkg/config/utils.go) | 可提交配置入口使用 `supabase/config.toml` |
| Supabase CLI 初始化 | [Supabase CLI init flow](https://github.com/supabase/cli/blob/develop/apps/cli-go/internal/init/init.go) | 初始化只保证 config 与 gitignore；migration、seed 和测试目录按项目需要创建 |

## 13. 步骤 6 完成检查

- [x] 已确认单一 Next.js 应用仓库；
- [x] 已规划路由、共享组件、业务模块、工具函数和类型目录；
- [x] 已规划 Supabase migration、种子数据和 RLS policy 位置；
- [x] 已规划单元、集成、端到端、数据库约束和权限测试位置；
- [x] 已规划产品、架构、安全和运行文档位置；
- [x] 已记录命名、导入和禁止提交规则；
- [x] 8 个 P0 分组均有明确的代码、路由、数据库和测试位置；
- [x] 不存在可执行数据库策略的双重事实来源。
