# 第 4 天步骤 4：环境变量与安全忽略规则记录

> 所属计划：[第 4 天：项目骨架与开发环境搭建](../../DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> 前一步：[第 4 天步骤 3：仓库目录结构落实记录](DAY_4_STEP_3_REPOSITORY_STRUCTURE.md)
> 配置指南：[环境配置](../../../../operations/ENVIRONMENT_CONFIGURATION.md)
> 安全基线：[第 1 天核心技术栈决策记录](../day-1/DAY_1_TECH_STACK_DECISION.md)
> 执行日期：2026-08-06
> 状态：步骤 4 已完成；Supabase 公开开发值已安全配置

## 1. 执行结论

已建立 Next.js 与 Supabase 的环境变量合同、本地忽略配置、可提交示例和操作说明。
`.env.local` 已创建并被 Git 忽略；用户随后确认 Supabase 开发项目已创建并填写
项目 URL 与 publishable key。不回显值的安全检查确认两项必需配置非空、格式合理，
且没有被 Git 跟踪。可选的 server-only secret 继续保持为空。

当前应用在实际公开开发配置下通过生产构建，客户端构建未发现 server-only secret
标记。步骤 5 仍需实现 Supabase client 并验证远程服务可达，不能仅凭变量存在宣称
应用已经连接。

## 2. 变量合同

| 变量 | 作用域 | 当前是否必填 | 安全规则 |
|---|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 浏览器和服务端 | 连接 Supabase 时必填 | 视为公开构建配置，不是秘密 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 浏览器和服务端 | 连接 Supabase 时必填 | 低权限公开 key；必须配合 RLS |
| `SUPABASE_SECRET_KEY` | 仅服务端 | 默认不填 | 绕过 RLS；仅允许经批准的窄服务端流程使用 |

Next.js 会在构建时把 `NEXT_PUBLIC_` 变量内联到浏览器 JavaScript。任何 secret、
service-role key、数据库密码、CLI access token 或 session 都不得使用该前缀。

普通 browser client 和 user-session server client 使用 publishable key，让 `anon`
或 `authenticated` 角色继续受 RLS 保护。secret key 不用于普通用户请求，也不作为
“修复 RLS 问题”的替代方案。

## 3. 已创建或更新的配置

| 路径 | Git 状态 | 内容 |
|---|---:|---|
| `.env.example` | 可提交 | 三个变量名、作用域和安全说明；所有值为空 |
| `.env.local` | 忽略 | 本机开发文件；必需公开值已填写，可选 server-only secret 为空 |
| `.gitignore` | 可提交 | 忽略 `.env`、`.env.*`、`.env.local` 和 `.env.*.local`，仅允许 `.env.example` |
| `supabase/.gitignore` | 可提交 | 忽略 Supabase 本地 `.env*` 和 CLI 临时状态 |
| `README.md` | 可提交 | 变量表、获取位置和 secret 警告 |
| `docs/operations/ENVIRONMENT_CONFIGURATION.md` | 可提交 | 本地、Supabase、Vercel 和验证操作说明 |

Vercel 本地状态 `.vercel/` 已由根 `.gitignore` 忽略。Preview 与 Production 的
实际环境值未来在 Vercel 平台分别配置，不写入仓库。

## 4. 获取与填写流程

专用 Supabase 开发项目已经创建。本次采用并供未来轮换复用的填写流程为：

1. 在 Supabase Dashboard 打开项目 API settings 或 Connect dialog；
2. 将项目 URL 写入本机 `.env.local` 的 `NEXT_PUBLIC_SUPABASE_URL`；
3. 将 publishable key 写入 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；
4. 默认保持 `SUPABASE_SECRET_KEY` 为空；
5. 重启开发服务器；
6. 在步骤 5 运行不输出值的连接检查；
7. Production 由 Supabase integration 同步；Vercel Preview 作用域包含同一项目的公开
   URL／publishable key，但 Supabase 全量 Preview 凭据同步保持关闭，不加入
   service-role 或数据库连接凭据。

不得把 Dashboard 值复制到文档、聊天、Issue、PR、截图、测试 fixture 或终端回显。
Supabase CLI access token 和数据库密码不属于应用变量，不进入 `.env.example`。

## 5. 官方文档核对

本步骤通过 Context7 核对当前官方文档：

- [Next.js environment variables](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/02-guides/environment-variables.mdx)：
  非 `NEXT_PUBLIC_` 变量默认仅服务端可见，公开前缀变量会内联到浏览器构建；
- [Supabase server-side client environment variables](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/server-side/creating-a-client.mdx)：
  Next.js 使用项目 URL 与 publishable key；
- [Supabase API keys](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/api-keys.mdx)：
  publishable key 可用于公开组件，真实权限依赖 RLS；secret key 绕过 RLS，绝不进入浏览器。

## 6. 验证结果

| 检查 | 结果 |
|---|---|
| `git check-ignore -v .env.local` | 通过；命中根 `.gitignore` |
| `.env.development.local` 忽略 | 通过 |
| `supabase/.env.local` 忽略 | 通过 |
| `.vercel/project.json` 忽略 | 通过 |
| Git 跟踪的本地 env 文件 | 0 |
| `.env.example` 非空赋值 | 0 |
| `.env.local` 必需公开配置 | URL 与 publishable key 均非空且格式合理 |
| `.env.local` 可选 server-only secret | 保持为空 |
| 凭据形态扫描 | 未发现 Supabase、GitHub 或 private-key 形态的值 |
| 浏览器静态构建 secret 标记扫描 | 未发现 `SUPABASE_SECRET_KEY`、secret key 或 service-role 标记 |
| `npm run lint` | 通过 |
| `npm exec tsc -- --noEmit` | 通过 |
| `npm run build` | 通过；Next.js 正确读取已配置的 `.env.local` |

扫描只报告通过／失败和文件名，不在输出中复述任何可能的秘密值。

## 7. 步骤 4 验收清单

- [x] 已列出应用连接 Supabase 所需的变量名称；
- [x] 已区分浏览器公开配置与仅服务端 secret；
- [x] 已创建被忽略的 `.env.local`；
- [x] 已填入 Supabase 项目 URL 与 publishable key，并完成不回显值的格式检查；
- [x] 已创建只含变量名和说明的 `.env.example`；
- [x] 已验证 `.gitignore` 忽略本地环境文件；
- [x] 已搜索工作区和客户端构建，未发现意外密钥；
- [x] README 已说明变量获取位置、用途和安全边界；
- [x] Git 未跟踪任何本地环境文件；
- [x] 配置实际公开开发值后 production build 仍通过。

环境变量结构、安全忽略规则和本地公开开发配置均已完成。步骤 5 可以开始，但在
客户端实现和服务可达性检查通过前，不得把 Supabase 连接状态描述为已验证。
