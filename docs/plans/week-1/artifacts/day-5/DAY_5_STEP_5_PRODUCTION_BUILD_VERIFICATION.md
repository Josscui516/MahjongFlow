# 第 5 天步骤 5：生产构建验证记录

> 所属计划：[第 5 天：工程质量基线、周验收与下周准备](../../DAY_5_QUALITY_AND_WEEKLY_ACCEPTANCE.md)
> 环境依据：[环境配置](../../../../operations/ENVIRONMENT_CONFIGURATION.md)
> 部署依据：[Vercel 部署操作](../../../../operations/VERCEL_DEPLOYMENT.md)
> 执行日期：2026-08-07（Australia/Sydney）
> 状态：步骤 5 完成；干净本地构建与当前 Vercel Production 可观察行为一致

## 1. 执行结论

已使用与部署配置一致的 `npm run build` → `next build` 入口，从已删除旧 `.next` 输出的状态完成 Next.js 16.3.0 Turbopack 生产构建。编译、TypeScript、页面数据收集、静态生成和最终优化全部通过，没有构建错误或警告，并生成有效 `.next/BUILD_ID`。

步骤 4 更新 lockfile 后又执行了一次 `npm ci`，确认锁定依赖可重新安装；随后重新清理 `.next` 并完成最终构建。最新 Vercel Production 为同一 Git HEAD `d433c78`，状态 `READY`，使用相同 Next.js 版本、Turbopack、构建入口和路由分类；Production 根页面和 Supabase 健康接口当前均返回 HTTP `200`。

当前 Day 5 变更仍是未提交的本地修改，因此没有声称它们已经部署，也没有触发 Vercel 新部署。精确的 PR／Preview 构建仍由步骤 6 在获得相应 Git 与 GitHub 授权后验证。

## 2. 配置依据

- 已读取当前安装版本的 Next.js CLI 文档：`node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md`；
- 已通过 Context7 查询 Next.js 16 当前生产构建与类型检查说明；
- 已使用 Vercel deployment 工具只读检查最新 Production、构建日志和运行端点；
- `next.config.ts` 未覆盖 dist directory、bundler 或 TypeScript 错误处理，也未启用 `ignoreBuildErrors`；
- `package.json` 的 `build` script 与 Vercel 日志均为 `next build`。

## 3. 干净安装与输出清理

执行顺序：

```text
npm ci
→ 解析并核实仓库内 .next 的绝对路径
→ 删除 .next
→ 从无旧生成类型状态运行 npm run typecheck
→ lint 与 smoke test
→ 再次核实并删除 typegen 产生的 .next
→ npm run build
→ 检查 .next/BUILD_ID
```

清理目标固定为 `D:\joshu\Documents\Projects\MahjongFlow\.next`，每次删除前均确认它是仓库根目录内的目录；只删除可重建的构建输出，没有删除源码、依赖、环境文件或用户资料。

`npm ci` 安装并审计 411 个 package，报告 0 个漏洞。`unrs-resolver@1.12.2` 的 lifecycle-script 审批提示仍对应 D5-OI-07，本步骤没有执行静默批准。

## 4. 环境合同检查

| 检查 | 结果 |
|---|---|
| `.env.local` | 存在且由 Git 忽略；未输出内容 |
| `NEXT_PUBLIC_SUPABASE_URL` | 本地文件中存在非空变量名记录；未读取或显示值 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 本地文件中存在非空变量名记录；未读取或显示值 |
| `.env.example` | 两个必需变量名均已记录 |
| 未记录本地变量 | 无；构建没有报告缺少环境变量 |
| server secret | 构建不需要 `SUPABASE_SECRET_KEY` |

Next.js 构建日志只显示加载了 `.env.local`，没有输出任何变量值。

## 5. 干净 typecheck 回归与修正

第一次清理 `.next` 后，旧的 `npm run typecheck` → `tsc --noEmit` 报告 `src/app/layout.tsx` 无法找到全局 `LayoutProps`。原因不是应用类型错误，而是该类型由 Next.js 路由类型生成器提供；旧入口隐式依赖之前的 `.next/types`。

按照当前 Next.js 16.3.0 文档，统一入口已修正为：

```text
npm run typecheck → next typegen && tsc --noEmit
```

修正后从不存在 `.next` 的状态运行，路由类型成功生成且 TypeScript 通过。D5-OI-01 继续保持关闭，并已同步更新步骤 1、步骤 3 与 Day 5 主计划，未通过改写 `LayoutProps`、增加宽泛类型或关闭检查绕过问题。

## 6. 最终本地构建结果

| 项目 | 结果 |
|---|---|
| Node.js／npm | 仓库约定的 Node.js 24.x／npm 11.16.0 环境 |
| Next.js | 16.3.0 |
| Bundler | Turbopack |
| `next.config.ts` | 成功加载 |
| 编译 | 通过，约 2.2 秒 |
| TypeScript | 通过，约 1.4 秒 |
| 静态页面生成 | 4/4，通过，约 418 毫秒 |
| 构建错误／警告 | 0／0 |
| `.next/BUILD_ID` | 存在 |

路由输出：

| Route | 类型 |
|---|---|
| `/` | Static |
| `/_not-found` | Static |
| `/api/health/supabase` | Dynamic |

## 7. Vercel 对照

| 对照项 | 本地最终构建 | 最新 Vercel Production | 结论 |
|---|---|---|---|
| Git 基线 | HEAD `d433c78` 加未提交 Day 5 质量配置 | `d433c78` | 应用源码基线一致；Day 5 配置尚未部署 |
| 状态 | 成功 | `READY` | 一致 |
| Framework | Next.js 16.3.0 | Next.js 16.3.0 | 一致 |
| Bundler | Turbopack | Turbopack | 一致 |
| 构建入口 | `npm run build` → `next build` | `npm run build` → `next build` | 一致 |
| TypeScript | 通过 | 通过 | 一致 |
| 静态生成 | 4/4 | 4/4 | 一致 |
| 路由 | `/`、`/_not-found`、`/api/health/supabase` | 相同三条及相同分类 | 一致 |
| Production `/` | 不在本步骤启动本地服务器 | HTTP `200` | 远程可用 |
| Production health | 不调用真实服务完成本地单元测试 | HTTP `200`，最小 `status: ok` | 远程连接可用 |

Vercel 最新构建日志没有错误，部署与 alias 状态正常。对照仅为只读检查；没有创建 Preview、重新部署、提升或回滚任何 deployment。

## 8. 最终质量复验

| 命令 | 结果 |
|---|---|
| `npm ci` | 通过；0 vulnerabilities |
| 从无 `.next` 状态运行 `npm run typecheck` | 通过；先生成路由类型 |
| `npm run lint` | 通过 |
| `npm test` | 通过；1 file、1 test |
| 再次清理后运行 `npm run build` | 通过 |
| `git diff --check` | 通过 |

## 9. 步骤 5 完成检查

- [x] 已清理旧本地构建输出；
- [x] 已使用与部署一致的入口执行生产构建；
- [x] 已检查构建日志中的错误和警告；
- [x] 已修复干净输出下暴露的独立 typecheck 基线缺口；
- [x] 构建不需要未记录的本地变量；
- [x] 已从干净输出再次构建并记录结果；
- [x] 已只读对照 Vercel Production 的版本、bundler、入口、路由与运行状态；
- [x] 没有执行未经授权的部署或其他远程写操作。

步骤 5 完成。下一步应执行 Day 5 步骤 6“建立 CI 工作流”。
