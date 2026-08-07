# 第 4 天步骤 9：干净安装验证记录

> 所属计划：[第 4 天：项目骨架与开发环境搭建](../../DAY_4_PROJECT_SETUP_AND_ENVIRONMENT.md)
> 安装入口：[根目录 README](../../../../../README.md#prerequisites)
> 环境指南：[环境配置](../../../../operations/ENVIRONMENT_CONFIGURATION.md)
> 执行日期：2026-08-07
> 状态：步骤 9 已完成；独立目录可从远程 `main` 安装、启动、连接和构建

## 1. 执行结论

已在系统临时目录创建与现有工作区隔离的第二套环境，从 canonical GitHub URL 重新
克隆 `main`，并严格按 README 执行依赖安装、环境配置、开发服务器启动、根页面检查、
Supabase 健康检查、lint、typecheck 和生产构建。

验证副本、远程 `main` 与原工作区均指向提交
`0cc69f0b70b848486ab29e9939c90d8efc193a75`。验证没有复用原工作区的
`node_modules`、`.next` 或 Git 工作树；公开 Supabase 配置通过被忽略的本地环境文件
安全提供，期间没有回显或记录真实值。

## 2. 独立环境与安装过程

```text
从远程 main 创建独立克隆
→ 核对 Node.js 与 npm
→ npm ci
→ 建立被忽略的 .env.local
→ npm run dev（独立端口）
→ 检查 / 与 /api/health/supabase
→ npm run lint
→ npm exec tsc -- --noEmit
→ npm run build
```

| 检查项 | 结果 |
|---|---|
| 获取方式 | 从 `https://github.com/Josscui516/MahjongFlow.git` 独立克隆 `main` |
| Git 基线 | 原工作区、独立克隆与远程 `main` 的 commit 一致 |
| Node.js | `v24.18.0`，符合 `24.x` 策略 |
| npm | `11.16.0`，与 `packageManager` 一致 |
| `npm ci` | 通过；安装并审计 376 个 package，0 个漏洞 |
| `.env.local` | 两个必需公开变量均存在，且 `.gitignore` 规则命中；未读取或输出值 |
| 开发服务器 | Next.js `16.3.0` 在独立端口启动，323 ms 后 Ready |
| 根页面 | HTTP `200` |
| Supabase 健康接口 | HTTP `200`；`status: ok` |
| `npm run lint` | 通过 |
| `npm exec tsc -- --noEmit` | 通过 |
| `npm run build` | 通过；静态根页面与动态健康接口均成功生成 |
| 服务日志 | 无 stderr；没有配置值或敏感响应内容 |

## 3. 问题、修正与复验

核心安装和运行步骤没有失败，因此无需修改 README、环境变量合同或项目配置。

`npm ci` 报告 `unrs-resolver@1.12.2` 的 postinstall 尚未纳入本机 npm
`allowScripts` 审批清单。安装仍返回成功，lint、typecheck、开发服务器和生产构建均
通过，因此该提示不是 Day 4 阻断项。第 5 天建立质量基线时应确认团队是否采用统一的
npm lifecycle-script 审批策略，避免每台机器出现不同的本地决定。

验证命令最初尝试合并为单个本地自动化命令时被本机安全策略拒绝；没有因此执行应用
操作或泄露配置。随后将同一流程拆分为安装、配置、启动、请求、停止和构建步骤，全部
通过。这个工具层限制不属于项目安装缺陷，也不要求新成员执行额外步骤。

## 4. 验收清单

- [x] 已在独立目录从远程仓库重新获取项目；
- [x] 未复用原工作区的依赖或构建输出；
- [x] 已按 README 使用锁定的 Node.js、npm 和 `npm ci`；
- [x] 已建立被忽略的本地环境变量文件，且未回显真实值；
- [x] 开发服务器和根页面正常；
- [x] Supabase 健康接口返回 HTTP `200` 和 `status: ok`；
- [x] lint、typecheck 和生产构建通过；
- [x] 已记录非阻断安装提示和处理结论；
- [x] 独立环境不依赖口头补充步骤即可完成核心验收。

步骤 9 已完成。该独立目录验证满足本日计划允许的“另一名成员或独立目录”路径；
周级计划中“至少两名成员的本地环境”仍应由实际第二名团队成员在第 5 天验收时确认。
