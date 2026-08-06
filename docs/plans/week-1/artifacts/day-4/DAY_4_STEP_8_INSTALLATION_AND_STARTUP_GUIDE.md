# 第 4 天步骤 8：安装与启动文档验收记录

> 所属计划：[第 4 天：项目骨架与开发环境搭建](../../DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> 使用入口：[根目录 README](../../../../../README.md#prerequisites)
> 环境指南：[环境配置](../../../../operations/ENVIRONMENT_CONFIGURATION.md)
> 部署指南：[Vercel 部署操作](../../../../operations/VERCEL_DEPLOYMENT.md)
> 执行日期：2026-08-06
> 状态：步骤 8 已完成；安装、配置、启动和基础验证路径已集中记录

## 1. 执行结论

根目录 README 现已提供不依赖撰写者本机路径的完整新成员操作路径：

```text
确认权限与版本
→ 克隆仓库
→ npm ci
→ 从 .env.example 创建 .env.local
→ 填写公开 Supabase 配置
→ npm run dev
→ 验证根页面和健康接口
→ lint、typecheck、build
```

应用的日常启动使用托管 Supabase 开发项目，不要求本机启动数据库。只有 migration、
数据库重建和数据库 lint／diff 工作需要 Docker Desktop 与本地 Supabase 栈。文档已将
两条路径分开，避免新成员为普通前端启动执行不必要的数据库操作。

## 2. 运行时、工具与权限

| 前置条件 | 文档结论 |
|---|---|
| GitHub | 克隆需要仓库 read 权限；协作写入仍遵循 Issue、分支和 Pull Request 约定 |
| Node.js | 项目统一使用 `24.x`；当前验证版本为 `24.18.0`，并提供 `.nvmrc` |
| npm | 统一使用 `11.16.0` 和 `package-lock.json`；安装命令为 `npm ci` |
| Supabase | 需要项目访问权以取得 URL 与 publishable key；普通 client 不使用 secret |
| Vercel | 查看设置和受保护 Preview 需要目标项目／团队访问权 |
| Docker Desktop | 仅本地 Supabase 数据库工作需要 |

Next.js 16 当前官方要求最低 Node.js `20.9.0` 和 TypeScript 5.1；仓库冻结的 Node.js
`24.x` 与 TypeScript 5 满足该要求。依赖的精确版本由 `package-lock.json` 固定，
不应再引入 pnpm、Yarn 或 Bun lockfile。

## 3. 安装与配置路径

README 已记录：

1. 使用 canonical GitHub URL 克隆仓库；
2. 进入仓库相对目录并执行 `npm ci`；
3. 使用 POSIX 或 PowerShell 命令复制 `.env.example` 为 `.env.local`；
4. 只填写 `NEXT_PUBLIC_SUPABASE_URL` 和
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；
5. 默认保持 `SUPABASE_SECRET_KEY` 为空；
6. 修改环境值后重新启动开发服务器；
7. 不在命令、日志、截图、Issue、Pull Request 或 Markdown 中复制真实值。

所有路径均相对于仓库根目录，没有记录当前用户目录、临时目录或其他本地绝对路径。

## 4. 启动、连接与构建检查

文档将以下命令作为基础路径：

```bash
npm run dev
curl --fail http://localhost:3000/api/health/supabase
npm run lint
npm exec tsc -- --noEmit
npm run build
```

同时为 Windows PowerShell 提供 `Invoke-RestMethod` 检查方式。健康接口的成功响应只
包含 `service: supabase` 和 `status: ok`，并明确说明它不验证业务 schema、migration、
RLS 或认证 session。

## 5. Supabase 与 Vercel 配置入口

| 目的 | 入口 |
|---|---|
| 取得 Supabase 公共配置 | Supabase Project Connect 或 Project Settings → API Keys |
| 检查 Supabase GitHub 连接 | Supabase Project Settings → Integrations → GitHub |
| 检查 Supabase／Vercel 同步 | Supabase Project Settings → Integrations → Vercel |
| 检查 Vercel 仓库和生产分支 | Vercel Project Settings → Git |
| 检查变量作用域 | Vercel Project Settings → Environment Variables |
| 检查 Production／Preview | Vercel Project Deployments |

Production、Preview 和 Development 变量必须按作用域分别检查。当前 Preview 共用现有
Supabase 项目，仅配置公共 URL 与 publishable key，且必须继续限制为虚构数据与
非破坏性测试。

## 6. 安全与隐私警告

- 只在开发、测试、Preview、截图和演示中使用虚构或匿名化数据；
- 不提交 `.env.local`、Supabase access token、数据库密码、secret／service-role key；
- 不把 `SUPABASE_SECRET_KEY` 加上 `NEXT_PUBLIC_` 前缀或导入 Client Component；
- publishable key 是公开 client 配置，不替代数据库授权；暴露表仍必须启用 RLS；
- 不使用 secret key 绕过 migration、Data API grant、RLS 或 policy 错误；
- 未经明确授权，不执行远程数据库 push、reset、repair、restore 或破坏性 Preview 测试。

## 7. 官方资料复核

执行时通过 Context7 与产品官方资料复核：

- [Next.js installation](https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/01-installation.mdx)：
  npm 开发命令与 Next.js 16 的 Node.js／TypeScript 要求；
- [Supabase CLI quick start](https://github.com/supabase/cli/blob/develop/apps/docs/content/docs/index.mdx)：
  CLI 本地启动和 migration 命令边界；
- [Vercel environment variables](https://vercel.com/docs/environment-variables)：
  Production、Preview、Development 与自定义环境作用域；
- [Supabase changelog](https://supabase.com/changelog)：2026-08-06 检查到的近期 breaking
  changes 不影响本步骤的安装、公开应用配置或本地启动路径。

## 8. 实际验证结果

| 检查 | 结果 |
|---|---|
| `node --version` | `v24.18.0`，符合 `24.x` 策略 |
| `npm --version` | `11.16.0`，与 `packageManager` 一致 |
| 两个必需公开变量 | 均存在于被忽略的 `.env.local`；未回显值 |
| `.env.local` ignore | `.gitignore` 规则命中 |
| `npm run lint` | 通过 |
| `npm exec tsc -- --noEmit` | 通过 |
| `npm run build` | 通过；Next.js `16.3.0`，仅根页面、not-found 和健康接口 |
| 本地根页面 | HTTP `200` |
| 本地 Supabase 健康接口 | HTTP `200`；仅返回 `service: supabase`、`status: ok` |

`npm ci` 的真正干净环境回放属于步骤 9，本步骤没有用当前已有的 `node_modules`
替代该验收，也没有提前勾选“另一名成员已完成干净安装和构建”。

## 9. 验收清单

- [x] 已记录运行时、包管理器与账号权限；
- [x] 已记录 canonical clone URL 与 `npm ci`；
- [x] 已记录从 `.env.example` 建立本地配置的 POSIX 和 PowerShell 方式；
- [x] 已记录开发服务器、根页面和 Supabase 健康检查；
- [x] 已记录 lint、typecheck 和生产构建命令；
- [x] 已记录可选本地 Supabase 数据库流程及 Docker 前置条件；
- [x] 已记录 Supabase 与 Vercel 配置入口和环境作用域；
- [x] 已加入密钥、真实数据、RLS 和远程数据库操作警告；
- [x] 文档未使用撰写者本地绝对路径；
- [x] 文档没有包含真实环境值、token、密码或参与者数据。

步骤 8 已完成。步骤 9 仍需在独立目录严格按根 README 执行干净安装，不能把当前
工作区的成功记录替代第二套环境验收。
