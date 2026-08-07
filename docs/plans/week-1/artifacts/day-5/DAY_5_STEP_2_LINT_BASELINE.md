# 第 5 天步骤 2：lint 配置与验证记录

> 所属计划：[第 5 天：工程质量基线、周验收与下周准备](../../DAY_5_QUALITY_AND_WEEKLY_ACCEPTANCE.md)
> 遗留输入：[步骤 1：遗留问题与风险分级清单](DAY_5_STEP_1_OUTSTANDING_ISSUES_AND_RISKS.md)
> 执行日期：2026-08-07（Australia/Sydney）
> 状态：步骤 2 完成；统一 lint 入口通过

## 1. 执行结论

项目继续使用 Next.js 16.3.0 随附的 ESLint flat config，并保留以下规则集：

- `eslint-config-next/core-web-vitals`；
- `eslint-config-next/typescript`；
- ESLint 9 的 `defineConfig` 与 `globalIgnores`。

统一入口已明确为 `npm run lint` → `eslint .`。应用代码、JavaScript／TypeScript 配置文件和测试代码均由仓库根目录递归检查；生成文件、依赖、本地平台状态、构建输出、coverage 和测试报告不进入 lint。没有关闭规则，也没有新增无说明例外。

## 2. 配置依据

- 已读取当前安装版本的 Next.js 文档：`node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md`；
- Next.js 16 已移除 `next lint`，当前文档要求直接使用 ESLint CLI；
- 已通过 Context7 查询 ESLint 9.39 flat config 文档；全局目录忽略使用 `globalIgnores()`，模式在 ESLint 默认忽略之后追加；
- 当前安装版本：Next.js／`eslint-config-next` 16.3.0，ESLint 9.39.5。

## 3. 覆盖范围

| 类别 | 代表路径／后缀 | 结果 |
|---|---|---|
| 应用代码 | `src/**/*.{js,jsx,ts,tsx}` | 覆盖 |
| 配置与自动化脚本 | `*.{js,mjs,cjs}`、`.github/scripts/**/*.mjs` | 覆盖 |
| 测试代码 | `tests/**/*.{js,jsx,ts,tsx}`、现有 `*.test.mjs` | 覆盖；后续新增测试无需另建 lint 入口 |
| SQL 与 Markdown | `*.sql`、`*.md` | 不适用；当前 ESLint 规则不解析这些格式 |

## 4. 全局忽略范围

| 类别 | 模式 | 理由 |
|---|---|---|
| 依赖与版本控制 | ESLint 默认的 `**/node_modules/`、`.git/` | 外部依赖和 Git 内部状态 |
| Next.js／构建输出 | `.next/**`、`out/**`、`build/**`、`dist/**` | 自动生成且可重建 |
| 测试产物 | `coverage/**`、`test-results/**`、`playwright-report/**` | 运行结果，不是源代码 |
| 本地平台状态 | `.supabase/**`、`supabase/.temp/**`、`.vercel/**` | 机器本地状态，可能包含环境元数据 |
| 生成类型 | `next-env.d.ts`、`src/types/database.generated.ts` | 仅由框架或 Supabase CLI 生成，不手工修补 |

忽略范围与 `.gitignore` 及仓库结构基线一致。没有忽略 `src/`、`.github/scripts/`、测试目录或普通配置文件。

## 5. 变更

1. 将 `package.json` 的 `lint` script 从隐式的 `eslint` 改为明确的 `eslint .`；
2. 在 `eslint.config.mjs` 中补充构建、测试产物、本地平台状态和生成数据库类型的全局忽略模式；
3. 保留 Next.js Core Web Vitals 与 TypeScript 推荐规则，不降低错误级别。

## 6. 验证结果

| 验证 | 预期 | 结果 |
|---|---|---|
| `npm run lint` | 使用统一入口检查仓库并以退出码 0 完成 | 通过 |
| 应用文件配置解析 | `src/app/page.tsx` 可取得 ESLint 配置 | 通过 |
| 配置／脚本解析 | `eslint.config.mjs` 与 `.github/scripts/project-automation.test.mjs` 可取得 ESLint 配置 | 通过 |
| 未来 TypeScript 测试配置解析 | `tests/unit/smoke.test.ts` 可取得 TypeScript lint 配置 | 通过 |
| 忽略检查 | 生成文件、构建输出和报告路径被全局忽略 | 通过 |
| `git diff --check` | 无空白错误 | 通过 |

本步骤只改变 lint 配置、npm lint 入口和执行记录，没有修改业务逻辑、数据库、权限或环境值。

## 7. 步骤 2 完成检查

- [x] 已检查当前 lint 配置；
- [x] 已确认覆盖应用代码、配置文件和测试代码；
- [x] 已排除生成文件、构建输出和不应检查的目录；
- [x] 已提供统一的 `npm run lint` 入口；
- [x] 当前项目 lint 无错误；
- [x] 没有通过全局关闭规则绕过问题；
- [x] 已再次运行并记录通过结果。

步骤 2 完成。下一步应执行 Day 5 步骤 3“配置并验证 typecheck”。
