# 第 4 天步骤 7：Vercel 与远程环境审计记录

> 所属计划：[第 4 天：项目骨架与开发环境搭建](../../DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> 环境指南：[环境配置](../../../../operations/ENVIRONMENT_CONFIGURATION.md)
> 部署指南：[Vercel 部署操作](../../../../operations/VERCEL_DEPLOYMENT.md)
> 执行日期：2026-08-06
> 状态：步骤 7 已完成；Production 与受保护 Preview 均通过 Supabase 健康验证

## 1. 执行结论

仓库所有权已经转移到 `Josscui516`。Supabase GitHub integration、Supabase Vercel
integration 和 Vercel Git 连接均指向正确仓库／项目；框架为 Next.js，生产分支为
`main`。

已使用最新 Vercel Project Settings 重新部署 Production，并从同一已验证源码直接
创建 Preview deployment。两个部署均进入 `Ready`，根页面和
`/api/health/supabase` 均返回 HTTP `200`。Production 使用公开域名，Preview 保持
Vercel Authentication 保护；匿名访问 Preview 会跳转登录，不应关闭该保护。

用户明确批准现阶段让 Preview 共用现有 Supabase 项目。Supabase Free 计划不支持
database branching，因此两个 Vercel 环境访问同一个数据库。Vercel Preview 作用域
包含 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；没有加入
service-role key、数据库密码或 Postgres 连接变量。Supabase 全量 Preview 凭据同步
保持关闭，因为其确认流程明确会加入上述高权限凭据。该策略仅允许虚构数据和
非破坏性测试。

## 2. 配置与部署结果

| 检查项 | 结果 | 状态 |
|---|---|---|
| GitHub 所有者／默认分支 | `Josscui516/MahjongFlow`／`main` | 正确 |
| 仓库权限 | 当前账号为 admin；团队成员保留 push 权限 | 正确 |
| 本地 `origin` | `https://github.com/Josscui516/MahjongFlow.git` | 已规范化并验证可访问 |
| Vercel 项目／框架 | `mahjong-flow`／Next.js | 正确 |
| Production 来源 | `main`，目标 commit 与仓库 HEAD 一致 | 正确 |
| Production deployment | 重新部署后为 `Ready` | 通过 |
| Production 根页面 | HTTP `200` | 通过 |
| Production Supabase health | HTTP `200`，最小 `status: ok` 响应 | 通过 |
| Preview deployment | [受保护部署](https://mahjong-flow-5bl9x7us6-joshuas-projects-e2e6b817.vercel.app) 为 `Ready` | 通过 |
| Preview 根页面 | 通过已授权会话访问，HTTP `200` | 通过 |
| Preview Supabase health | 通过短期授权访问，HTTP `200`，最小 `status: ok` 响应 | 通过 |
| Preview 环境变量 | 仅公开 URL 与 publishable key；未读取值 | 通过 |
| Supabase 全量 Preview sync | 保持关闭，未同步高权限凭据 | 正确 |
| Development 环境同步 | 保持关闭；本地 `.env.local` 继续生效 | 正确 |
| Supabase GitHub working directory | `.`，仓库根目录包含 `supabase/` | 正确 |
| Supabase production branch | `main`，Deploy to production 已开启 | 正确但需保护分支 |
| Supabase branching | Free 计划不可用；现阶段明确共用项目 | 已接受限制 |
| Supabase remote migration history | 尚无记录 | 已记录；空基线尚未远程应用 |
| GitHub `main` protection | 未配置 | Week 2 前高优先级处理 |

## 3. 验证证据

| 验证 | 结果 |
|---|---|
| Production build | `Ready`；错误过滤日志没有构建错误 |
| Preview build | `Ready`；错误过滤日志没有构建错误 |
| Production `/` | HTTP `200` |
| Production `/api/health/supabase` | HTTP `200`；`service: supabase`、`status: ok` |
| Preview `/` | HTTP `200`；初始 Next.js 页面正常渲染 |
| Preview `/api/health/supabase` | HTTP `200`；`service: supabase`、`status: ok` |
| Vercel runtime errors | 最近一小时没有错误 cluster |
| 环境值与日志安全 | 未读取、记录或输出任何真实变量值 |

运行日志状态码汇总仍包含一次旧 Production deployment 的 HTTP `503`；它发生在重新部署
之前。新 Production 和 Preview 的实际健康请求均为 HTTP `200`，因此不构成当前失败。

## 4. 共享 Supabase 项目的限制

- Production 与 Preview 会看到同一数据库状态，Preview 不是隔离沙箱；
- Preview 只允许虚构或匿名化数据，禁止真实参与者数据；
- 禁止在 Preview 执行 destructive migration、reset、repair 或破坏性测试；
- Preview 代码不得读取或新增 service-role key、数据库密码和 Postgres 连接变量；
- 第 2 周开始涉及 schema、RLS 或真实工作流前，应重新评估独立 Preview 项目；
- 如果后续启用 Supabase branching，应改为每个 Pull Request 使用隔离 preview database。

## 5. Git 与保护边界

本次直接在 Vercel 中从已验证部署创建 Preview，没有创建 Git 分支、commit、push 或
Pull Request，也没有混入当前工作区尚未提交的文档改动。

`main` 同时触发 Vercel Production 和 Supabase production migration，而当前仍没有
branch protection。该项不是 Day 4 步骤 7 的部署验收条件，但必须在 Week 2 前完成：
要求 Pull Request、至少一名非作者批准、禁止 force push 和分支删除，并在 CI 可用后
加入必需状态检查。

## 6. 步骤 7 验收清单

- [x] Vercel 项目已连接到新所有者下的 GitHub 仓库；
- [x] 框架、Production branch 和生产 URL 已核对；
- [x] Production 已用最新环境设置重新部署并进入 `Ready`；
- [x] Production 页面与 Supabase 健康接口返回 HTTP `200`；
- [x] 已建立并验证真实 Vercel Preview deployment；
- [x] Preview 页面与 Supabase 健康接口返回 HTTP `200`；
- [x] Preview 共用现有 Supabase 项目的决定与风险已明确记录；
- [x] Preview 只包含公开 URL 和 publishable key；
- [x] Production 与 Preview 构建无错误，最近一小时无 runtime error cluster；
- [x] 页面、响应、日志和文档没有暴露环境变量值。

步骤 7 已完成，可以继续执行步骤 8。`main` protection 和未来 Preview 数据库隔离
属于已记录的后续治理项；本地 `origin` canonical URL 已于步骤 8 前完成更新。
