# 第 4 天步骤 1：环境前置条件检查记录

> 所属计划：[第 4 天：项目骨架与开发环境搭建](../../DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> 技术基线：[第 1 天核心技术栈决策记录](../day-1/DAY_1_TECH_STACK_DECISION.md)
> 协作基线：[第 1 天 Git 与团队协作约定](../day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md)
> 检查日期：2026-08-06
> 状态：本地、GitHub 和 Supabase 项目前置条件已完成；Vercel 创建权限待准备

## 1. 检查结论

第 4 天步骤 1 的本地运行时、包管理器、Git 远程、默认分支、GitHub
仓库权限和现有文件保护检查已经完成。当前机器可以使用选定的 Node.js 与 npm
版本继续初始化。用户先前于 2026-08-06 确认尚无 Supabase 开发项目，随后确认
项目已经创建，并已填写本地项目 URL 与 publishable key；安全检查验证了配置存在、
格式合理且未被 Git 跟踪。当前仍暂时不能在目标 Vercel 账号或团队中创建项目。

剩余远程前置项只有：准备目标 Vercel 账号或团队的项目创建权限。

用户同时明确 Day 4 暂不要求 GitHub Issue，项目 Issue 从 Week 2 开始使用。
因此 Day 4 Issue 不再作为本步骤阻塞项。由于当前仍在 `main`，且没有创建工作分支
的明确授权，本步骤没有执行任何分支、暂存、提交或推送操作。

Supabase client 和远程可达性仍由步骤 5 实际验证，不能仅凭配置存在描述为已经连接。
Vercel 权限准备完成前，步骤 7 继续明确标记为阻塞。

## 2. GitHub 仓库与默认分支

| 检查项 | 实际结果 | 状态 |
|---|---|---|
| 仓库地址 | `https://github.com/Caiqwe123/MahjongFlow.git` | 通过 |
| 远程名称 | `origin` | 通过 |
| 默认分支 | 远程 `HEAD` 指向 `main` | 通过 |
| 当前本地分支 | `main` | 已记录；不得直接提交 Day 4 实现 |
| 本地跟踪关系 | 本地 `main` 跟踪 `origin/main`，检查时为最新 | 通过 |
| 工作树 | `git status --short` 无输出 | 通过 |
| 当前账号仓库权限 | GitHub 返回 `WRITE` | 通过 |

检查使用只读命令完成，没有创建分支、暂存、提交、推送或修改远程设置。

## 3. 团队仓库权限

GitHub 当前返回 4 名仓库协作者。权限汇总如下：

| GitHub 账号 | 仓库角色 | 拉取 | 推送 | 状态 |
|---|---|---:|---:|---|
| `Caiqwe123` | admin | 是 | 是 | 通过 |
| `Josscui516` | write | 是 | 是 | 通过 |
| `Scarletthekiller` | write | 是 | 是 | 通过 |
| `YUHAN2233` | write | 是 | 是 | 通过 |

以上结果只证明 GitHub 仓库级权限；成员是否均能访问 Supabase 与 Vercel
需要分别确认，不能由 GitHub 权限推断。

## 4. Node.js 与包管理器版本策略

### 4.1 实际版本

| 工具 | 当前机器版本 | 采用结论 |
|---|---|---|
| Git | `2.55.0.windows.1` | 可用 |
| Node.js | `24.18.0` | 采用 Node.js `24.x` 作为项目运行时系列 |
| npm | `11.16.0` | 采用 npm；步骤 2 生成并保留 `package-lock.json` |
| pnpm | `11.9.0` | 已安装，但本项目不并行使用第二套包管理器 |
| Yarn | 未安装 | 不采用 |
| Bun | 未安装 | 不采用 |
| Supabase CLI | 未全局安装 | 后续按项目开发依赖方式锁定，不依赖全局版本 |
| Vercel CLI | 未全局安装 | 后续可使用受控 CLI 或 Vercel Dashboard，不将全局安装作为可重复构建前提 |

### 4.2 冻结规则

- 采用 Node.js `24.x`。当前本地验证版本为 `24.18.0`；步骤 2 应在
  `package.json` 记录 `engines.node` 为 `24.x`，并增加团队使用的 Node 版本提示文件；
- 统一使用 npm `11.16.0`，在 `package.json` 使用 `packageManager` 字段记录，
  并以 `package-lock.json` 作为唯一 JavaScript 依赖锁文件；
- 不提交 pnpm、Yarn 或 Bun 的第二份 lockfile；
- Next.js、React、TypeScript 与 Tailwind CSS 的精确版本在步骤 2 通过稳定版初始化、
  安装和本地启动后由 `package.json` 与 lockfile 固定；不使用 canary、beta 或 RC；
- Supabase CLI 后续作为项目开发依赖锁定，避免依赖某位成员的全局安装；
- Vercel 构建应读取 `package.json` 的 Node.js `24.x` 要求，使本地和预览环境
  使用同一 major runtime。

当前 Next.js 16 文档声明最低 Node.js 版本为 `20.9.0`，所以本机 Node.js
`24.18.0` 满足框架要求。Vercel 当前支持 Node.js `24.x`、`22.x` 和 `20.x`，
默认使用 `24.x`，并支持通过 `package.json` 的 `engines.node` 覆盖项目设置。

## 5. Supabase 开发项目与访问权限

| 检查项 | 结果 | 状态 |
|---|---|---|
| 专用开发项目已经创建 | 用户确认项目已创建 | 通过 |
| 当前执行者能够访问项目配置 | 用户已填写本地 URL 与 publishable key，安全检查通过 | 通过 |
| 项目 reference | 不在文档或聊天中记录，避免传播环境标识 | 安全处理通过 |
| 远程数据库密码／access token | 未读取、未输出、未写入仓库 | 安全检查通过 |

后续验证应只确认项目存在和当前账号的访问权，不把 access token、数据库密码、
secret/service-role key 或真实项目环境值复制到文档、终端记录或聊天输出。
Supabase CLI 的官方流程为先登录，再使用项目 reference 执行链接；实际链接属于
后续步骤，不在本步骤提前执行。

## 6. Vercel 创建权限

| 检查项 | 结果 | 状态 |
|---|---|---|
| 目标 Vercel 账号／团队已确定 | 尚未准备完成 | 未满足 |
| 当前执行者可以创建项目 | 用户确认暂时不能，稍后解决 | 未满足 |
| GitHub 仓库连接权限 | GitHub 侧当前账号具有仓库写权限 | 部分通过；仍需 Vercel 侧确认 |
| Vercel token／环境值 | 未读取、未输出、未写入仓库 | 安全检查通过 |

步骤 7 前必须确认目标账号／团队、项目创建权限以及 GitHub provider 连接状态。
本步骤没有创建 Vercel 项目、部署或环境变量。

## 7. 现有文件保护检查

检查时仓库仍是文档型基线，根目录包含：

- `.git/`、`.github/` 和 `docs/`；
- `.gitignore`、`AGENTS.md` 和 `README.md`；
- 尚无 `package.json`、JavaScript lockfile、`src/`、`public/` 或 `supabase/`
  应用目录。

步骤 2 必须采用“在现有仓库中初始化”的方式，保留上述文件和全部 `docs/`
内容。初始化后需逐项检查生成器没有覆盖 `README.md`、`.gitignore`、`AGENTS.md`
或计划文档；如生成器提供同名文件，应先保留现有版本再人工合并必要内容。

现有 `.gitignore` 已覆盖环境文件、`.next/`、`node_modules/`、`.vercel/`、
`.supabase/`、数据库 dump 和本地 Supabase 环境文件。步骤 4 仍须结合实际生成文件
再次验证忽略规则。

## 8. Day 4 工作项与 Git 操作边界

GitHub 当前没有标题匹配 Day 4、project setup、environment 或 scaffold 的 Issue。
用户于 2026-08-06 明确说明 Week 1 的 Day 4 暂不使用 Issue，Issue 从 Week 2
开始使用。本记录据此将“缺少 Day 4 Issue”视为已澄清的 Week 1 执行例外，
不虚构编号，也不把现有业务功能 Issue 错用于项目骨架工作。

该澄清不自动授权任何 Git 写操作。当前仍在 `main`；如随后需要 Codex 创建分支、
暂存、提交、推送或创建 Pull Request，仍须分别获得对应的明确授权。没有真实
Issue 编号时，也不会创建带虚构编号的 `codex/` 分支。

## 9. 官方文档核对

本次通过 Context7 核对当前官方／高信誉文档：

- [Next.js 安装文档](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/01-getting-started/01-installation.mdx)：
  `create-next-app` 支持 npm，默认包含 TypeScript、Tailwind CSS 和 App Router；
- [Next.js 16 升级要求](https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/upgrading/version-16.mdx)：
  Node.js 最低版本为 `20.9.0`；
- [Supabase CLI README](https://github.com/supabase/cli/blob/develop/README.md)：
  CLI 可作为 npm 开发依赖安装，托管项目链接流程需要登录和项目访问；
- [Vercel Node.js 版本](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)：
  当前支持 Node.js `24.x`、`22.x` 和 `20.x`，并可用 `package.json` 声明运行时系列；
- [Vercel CLI Git 连接](https://vercel.com/docs/cli)：
  项目连接需要登录的 Vercel 账号和 Git provider 访问。

## 10. 步骤 1 验收清单

- [x] 已确认 GitHub 仓库地址和默认分支；
- [x] 已确认当前 4 名 GitHub 协作者具有仓库写入或管理员权限；
- [x] 已选择 Node.js `24.x` 与 npm `11.16.0` 版本策略；
- [x] 已创建 Supabase 开发项目并确认当前执行者能够取得所需公开配置；
- [ ] 已准备目标 Vercel 账号／团队及当前执行者的项目创建权限；
- [x] 已检查现有仓库文件并记录防覆盖要求；
- [x] 已记录当前实际运行时和包管理器版本；
- [x] 已确认 Week 1 Day 4 暂不要求 Issue，项目 Issue 从 Week 2 开始；
- [x] 检查过程中没有读取、记录或传播真实密钥与参与者数据；
- [x] 检查过程中没有执行未授权的 Git 写操作或外部项目创建操作。

## 11. 继续步骤 2 的开始条件

完整执行 Day 4 远程连接与部署前必须满足：

1. [已满足] Supabase 开发项目存在，且当前执行者能够取得所需公开配置；
2. [待满足] 目标 Vercel 账号或团队已经确定，且当前执行者可创建项目；
3. [已满足] 初始化继续使用本文确定的 Node.js `24.x` 与 npm `11.16.0` 策略。

步骤 5 现在可以开始 Supabase client 和真实连接验证。步骤 7 仍等待 Vercel 权限。
如需任何 Git 写操作，仍须单独授权。
