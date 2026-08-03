# 第 1 天核心技术栈决策记录

> 所属计划：[第 1 天：范围确认与技术基线冻结](../../DAY_1_SCOPE_AND_TECH_BASELINE.md)
> 产品基线：[MahjongFlow MVP 项目企划书](../../../../project/MVP_PROJECT_PROPOSAL.md)
> 决策日期：2026-08-03
> 状态：核心技术栈已冻结
> 文档核对：Context7 官方／高信誉文档，2026-08-03

## 1. 决策摘要

MahjongFlow MVP 使用一个全栈 Next.js 应用仓库。核心技术栈冻结如下：

| 层级 | 冻结方案 | 版本基线规则 | 状态 |
|---|---|---|---|
| Web 框架 | Next.js App Router | 第 4 天选择当时稳定、相互兼容的版本并由 lockfile 固定；以当前 Next.js 16 系列文档为初始化参考 | 已冻结 |
| 语言 | TypeScript | 使用所选 Next.js 支持的稳定版本，启用严格类型检查 | 已冻结 |
| UI 运行库 | React | 使用所选 Next.js 声明兼容的 React 版本，不单独强制不兼容版本 | 已冻结 |
| 样式 | Tailwind CSS v4 | 使用 `@tailwindcss/postcss` 和 CSS `@import "tailwindcss"` 集成 | 已冻结 |
| 数据库 | Supabase PostgreSQL | Schema 通过 SQL migration 管理 | 已冻结 |
| 身份认证 | Supabase Auth | Next.js 服务端渲染场景使用官方 SSR 客户端模式 | 已冻结 |
| 数据权限 | Supabase RLS + Next.js 服务端鉴权 | 两层同时执行，不是二选一 | 已冻结 |
| 应用部署 | Vercel | 部署 Next.js 应用和 Preview 环境 | 已冻结 |
| 数据服务部署 | Supabase | 托管开发／演示 PostgreSQL 与 Auth | 已冻结 |
| 版本管理 | GitHub + Pull Request | 短生命周期分支、PR 审查和状态检查 | 已冻结 |
| 项目管理 | GitHub Projects / Kanban | `Backlog → Ready → In Progress → Review → Testing → Done` | 已冻结 |

今天冻结产品与主要版本系列；第 4 天只有在依赖安装、类型检查和生产构建成功后才记录精确版本，并提交 package lockfile。补丁版本锁定不属于换栈；核心框架、数据库、认证或部署平台的替换属于技术基线变更。

## 2. 详细决策

### TECH-01：Next.js App Router + TypeScript

| 项目 | 决策内容 |
|---|---|
| 用途 | 在单一应用中承载页面、Server Components、受保护路由、Server Actions／Route Handlers 和服务端业务入口 |
| 采用理由 | 与 React、TypeScript 和 Vercel 直接配合；前后端同仓可减少学生团队的多仓库、独立 API 服务和部署协调成本 |
| 当前依据 | Next.js 官方源码文档将 App Router 和 TypeScript 作为 `create-next-app` 默认选择；Route Handlers 支持标准 HTTP 方法；官方安全指南要求 Server Action 内部执行资源授权 |
| 已知风险 | 将 Server Action 当作“天然私有”会产生越权风险；Server/Client Component 边界不清会泄露敏感字段；升级可能改变缓存、运行时或构建行为 |
| 控制措施 | 每个敏感 Server Action／Route Handler 都检查会话、角色和资源权限；默认只向 Client Component 传最少数据；版本由 lockfile 固定并在升级前运行构建与回归测试 |

### TECH-02：React

| 项目 | 决策内容 |
|---|---|
| 用途 | 构建组件、表单、列表、Dashboard 和交互状态 |
| 采用理由 | React 是 Next.js 的 UI 基础，避免增加第二套前端运行库 |
| 当前依据 | Next.js 负责声明兼容的 React 版本和 Server/Client Component 集成边界 |
| 已知风险 | 无必要的 Client Component 会增加浏览器 JavaScript；在客户端处理敏感授权会形成错误安全边界 |
| 控制措施 | 默认使用 Server Component；只有需要状态、事件或浏览器 API 时使用 `'use client'`；授权始终在服务端与 RLS 执行 |

### TECH-03：Tailwind CSS v4

| 项目 | 决策内容 |
|---|---|
| 用途 | 快速构建响应式布局、状态反馈和一致的管理界面样式 |
| 采用理由 | 与 Next.js 构建流程直接集成，适合快速迭代且不增加运行时 CSS-in-JS 依赖 |
| 当前依据 | 当前官方 Next.js 指南使用 `tailwindcss`、`@tailwindcss/postcss`、`postcss` 和 `@import "tailwindcss"` |
| 已知风险 | Tailwind 按文本扫描类名，运行时拼接出的不完整类名可能不生成 CSS；大量随意类名会导致视觉不一致 |
| 控制措施 | 使用完整静态类名映射，不动态拼接类名片段；共享模式提取为组件；依赖包内样式需要时显式使用 `@source` |

### TECH-04：Supabase PostgreSQL

| 项目 | 决策内容 |
|---|---|
| 用途 | 存储会议、决策、任务、活动、参与者、报名和签到等关系数据 |
| 采用理由 | PostgreSQL 可表达外键、枚举／检查、唯一约束、事务和 RLS，能直接实现 P0 的关系完整性与防重复要求 |
| 当前依据 | Supabase 为 PostgreSQL 提供托管服务、迁移能力和与 Auth/RLS 集成的数据访问路径 |
| 已知风险 | 只在应用层校验会产生重复报名、重复签到或关联不一致；在线直接改 schema 会造成环境漂移 |
| 控制措施 | 所有 schema 和策略变更通过 migration；唯一性与关键状态由数据库约束；数据库变更附带回滚说明和权限测试 |

### TECH-05：Supabase Auth + SSR 客户端模式

| 项目 | 决策内容 |
|---|---|
| 用途 | 提供委员会账号登录、登出、会话和服务端用户身份 |
| 采用理由 | 与 Supabase PostgreSQL 和 RLS 使用同一身份令牌链路，减少自建认证与同步角色的风险 |
| 当前依据 | 官方 Next.js 示例使用 `@supabase/ssr`、服务端 cookie 和 Server Client；认证 token 可在 PostgreSQL 中通过 `auth.uid()` 参与 RLS 判断 |
| 已知风险 | cookie 刷新处理错误会导致会话不稳定；只验证“已登录”而不验证角色和资源会产生越权 |
| 控制措施 | 第 4 天按官方 SSR 模式建立 browser/server client；敏感入口同时验证身份、角色和资源；用普通、授权和匿名三类会话测试 |

### TECH-06：Supabase RLS + Next.js 服务端鉴权

| 项目 | 决策内容 |
|---|---|
| 用途 | 在服务端业务入口和数据库行访问两层保护敏感数据 |
| 采用理由 | 服务端鉴权提供业务语义和清楚拒绝；RLS 防止接口遗漏、直接查询或代码路径错误导致越权 |
| 当前依据 | Supabase 官方说明 publishable key 的数据保护依赖启用并正确配置 RLS；secret/service-role key 会绕过 RLS，绝不能暴露给浏览器 |
| 已知风险 | 关闭 RLS、策略过宽或在浏览器使用 secret key 会直接破坏权限边界；仅隐藏按钮不能防止直接请求 |
| 控制措施 | 所有暴露表默认启用 RLS 和默认拒绝；浏览器只允许 publishable key；secret key 仅限必要的安全服务端环境且不得用于普通用户请求；直接接口和数据库策略都纳入测试 |

### TECH-07：Vercel + Supabase 部署

| 项目 | 决策内容 |
|---|---|
| 用途 | Vercel 托管 Next.js 应用及 Preview；Supabase 托管 PostgreSQL 与 Auth |
| 采用理由 | 与所选框架和数据平台匹配，能用较少运维工作建立本地、预览和演示环境 |
| 已知风险 | 环境变量不一致、区域延迟、免费配额、Preview 连接错误项目或平台短期故障 |
| 控制措施 | 分离本地／Preview／演示环境值；维护 `.env.example`；不提交密钥；第 4 天验证最小 Preview；保留本地演示和数据库备份方案 |

### TECH-08：GitHub + Pull Request + GitHub Projects

| 项目 | 决策内容 |
|---|---|
| 用途 | 版本控制、审查、需求追踪、Kanban 和 CI 状态反馈 |
| 采用理由 | 代码、issue、PR、审查和项目状态可在一个协作平台追踪 |
| 已知风险 | 大型长期分支、未关联需求的 PR、绕过审查合并或敏感文件误提交 |
| 控制措施 | 短生命周期分支；PR 关联 issue 和验收标准；至少一名他人审查；CI 通过后合并；密钥与真实数据禁止提交 |

## 3. 明确不采用的平行核心方案

为避免同一职责存在两个未决工具，本轮基线作出以下约束：

| 职责 | 本轮采用 | 不作为本轮平行基线 |
|---|---|---|
| Web/API 框架 | Next.js App Router | 独立 Express/NestJS 后端或第二个前端框架 |
| 数据库 | Supabase PostgreSQL | Firebase、MongoDB 或第二套主数据库 |
| 数据访问与迁移 | Supabase client + SQL migrations | 未经批准引入 Prisma、Drizzle 或另一套并行 ORM/migration 来源 |
| 身份认证 | Supabase Auth | NextAuth/Auth.js、Clerk 或自建密码认证 |
| 样式系统 | Tailwind CSS v4 | 未经批准引入第二套全局 CSS 框架 |
| 应用部署 | Vercel | 同时维护第二套生产应用托管平台 |
| 项目追踪 | GitHub Projects | 同时维护另一个作为事实来源的任务板 |

这不禁止使用小型、单一职责的辅助依赖。任何会接管表中核心职责的依赖都视为技术基线变更。

## 4. 安全与环境变量边界

| 数据／密钥 | 可进入浏览器 | 可提交 Git | 规则 |
|---|---|---|---|
| Supabase 项目 URL | 是 | 仅变量名／示例，不提交真实环境配置 | 通过环境变量注入 |
| Supabase publishable key | 可以，但仍通过环境变量管理 | 不在仓库写真实值 | 该 key 不提供数据权限；必须依赖 RLS |
| Supabase secret/service-role key | 绝不允许 | 绝不允许 | 会绕过 RLS，只能在确有必要的安全服务端环境使用 |
| 用户 token／session cookie | 不作为可读客户端配置暴露 | 绝不允许 | 使用安全 cookie 与官方 SSR 会话流程 |
| 真实参与者数据 | 不适用 | 绝不允许 | 开发和演示只用虚构或匿名化数据 |

## 5. 版本冻结与升级规则

1. 第 4 天使用官方初始化路径创建项目；
2. 选择彼此兼容的稳定版本，不使用 canary、beta 或 release candidate；
3. 提交 package manifest、lockfile、Node 引擎要求和实际验证结果；
4. 精确版本基线必须通过安装、lint、typecheck 和生产构建；
5. 补丁或安全更新可在通过完整基线检查后合入；
6. 主要版本升级必须先记录破坏性变化、迁移方式和回退方案；
7. 后续开发周不更换核心框架、数据库、认证、样式或部署平台，除非出现经证据确认的阻断性问题。

## 6. 技术基线变更门槛

“个人偏好”“新工具更流行”或“可能更方便”不构成阻断性问题。只有现有方案无法满足 P0、安全基线、课程交付环境或可重复构建，并且有可复现证据时，才可提出变更。

变更记录必须包含：

- 阻断问题与复现步骤；
- 受影响的 P0 ID 和验收场景；
- 已尝试的修复及结果；
- 候选替代方案、迁移成本和新增风险；
- 对排期、数据、权限、测试、部署和回滚的影响；
- 五名团队成员的书面一致批准结论。

批准前继续使用本文件中的冻结基线；不得在功能分支中先行引入平行核心方案。

## 7. 当前文档依据

| 主题 | 当前依据 | 本次采用的结论 |
|---|---|---|
| Next.js 默认技术选择 | [Next.js `create-next-app` 默认配置](https://github.com/vercel/next.js/blob/canary/packages/create-next-app/index.ts) | App Router、TypeScript 和 Tailwind 为受支持的主路径 |
| Next.js 服务端安全 | [Next.js Data Security Guide](https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/data-security.mdx) | Server Action 仍需逐资源授权，不能依赖入口不可见性 |
| Supabase Next.js SSR | [Supabase Next.js Auth 示例](https://github.com/supabase/supabase/blob/master/examples/prompts/nextjs-supabase-auth.md) | 使用官方 SSR client 与 cookie 模式建立服务端会话 |
| Supabase API key 与 RLS | [Supabase API Keys Guide](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/api-keys.mdx) | publishable key 必须配合 RLS；secret key 不得进入浏览器 |
| Tailwind + Next.js | [Tailwind Next.js Installation Guide](https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/app/(docs)/docs/installation/framework-guides/nextjs.tsx) | Tailwind v4 使用 PostCSS 插件与 CSS import |
| Tailwind 类名检测 | [Tailwind Detecting Classes Guide](https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/detecting-classes-in-source-files.mdx) | 使用完整静态类名，必要时显式声明扫描来源 |

文档 URL 用于追溯本次决策依据；第 4 天安装前仍需再次核对实际稳定版本和兼容性。

## 8. 步骤 5 完成检查

- [x] Web 框架确认为 Next.js App Router + TypeScript；
- [x] UI 确认为 React + Tailwind CSS v4；
- [x] 数据库与认证确认为 Supabase PostgreSQL + Supabase Auth；
- [x] 敏感权限确认为 Supabase RLS + Next.js 服务端鉴权；
- [x] 部署确认为 Vercel + Supabase；
- [x] 版本管理和项目管理确认为 GitHub PR + GitHub Projects；
- [x] 每项选型均记录用途、理由、风险和控制措施；
- [x] 已规定后续换栈门槛；
- [x] 不存在同一核心职责的未决平行工具。
