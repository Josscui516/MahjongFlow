# 第 5 天步骤 3：typecheck 配置与验证记录

> 所属计划：[第 5 天：工程质量基线、周验收与下周准备](../../DAY_5_QUALITY_AND_WEEKLY_ACCEPTANCE.md)
> 遗留输入：[步骤 1：遗留问题与风险分级清单](DAY_5_STEP_1_OUTSTANDING_ISSUES_AND_RISKS.md)
> 执行日期：2026-08-07（Australia/Sydney）
> 状态：步骤 3 完成；D5-OI-01 已关闭

## 1. 执行结论

项目现有 `tsconfig.json` 已启用完整严格模式和纯检查模式，不需要放宽类型或建立第二套配置。已在 `package.json` 增加可从干净构建输出运行的独立入口：

```text
npm run typecheck → next typegen && tsc --noEmit
```

`next typegen` 先生成 App Router 的全局 `LayoutProps` 等路由类型，再由 TypeScript 5.9.3 检查当前应用、Next.js 配置、生成的路由类型以及未来按仓库约定编写的 `*.test.ts`／`*.test.tsx` 测试。当前入口在存在或不存在旧 `.next` 输出时均以退出码 0 完成，当前没有类型错误。

## 2. 配置依据

- 已读取当前安装版本的 Next.js 文档：`node_modules/next/dist/docs/01-app/03-api-reference/05-config/02-typescript.md`；
- Next.js 16.3.0 文档确认项目级 CLI 会检查 `tsconfig.json` 选择的完整文件集合；当代码使用路由感知全局类型时，CI 应先运行 `next typegen`，再运行 `tsc --noEmit`；
- 已通过 Context7 查询 TypeScript 5.9.3 文档；`noEmit` 不影响语义诊断，`include`／`exclude` 决定根文件集合；
- 当前安装的 TypeScript 版本为 5.9.3。

## 3. 严格性检查

`tsconfig.json` 的 `strict: true` 在当前有效配置中展开为：

- `noImplicitAny`；
- `noImplicitThis`；
- `strictNullChecks`；
- `strictFunctionTypes`；
- `strictBindCallApply`；
- `strictPropertyInitialization`；
- `strictBuiltinIteratorReturn`；
- `alwaysStrict`；
- `useUnknownInCatchVariables`。

同时保留 `isolatedModules: true`、`moduleResolution: "bundler"`、`jsx: "react-jsx"` 和 Next.js TypeScript plugin。`next.config.ts` 没有启用 `typescript.ignoreBuildErrors`，因此独立 typecheck 与生产构建不会形成一套严格、一套绕过的双重标准。

## 4. 文件覆盖

| 类别 | 配置／代表路径 | 结果 |
|---|---|---|
| Next.js 类型入口 | `next-env.d.ts` | 覆盖；由 Next.js 生成，不手工修改 |
| 应用代码 | `src/**/*.ts`、`src/**/*.tsx` | 覆盖 |
| TypeScript 配置 | `next.config.ts` | 覆盖 |
| 应用单元／集成测试 | `tests/**/*.test.ts`、`tests/**/*.test.tsx` | 由 `**/*.ts`、`**/*.tsx` 自动覆盖 |
| ESM TypeScript | `**/*.mts` | 覆盖 |
| Next.js 路由类型 | `.next/types/**/*.ts`、`.next/dev/types/**/*.ts` | 覆盖，与当前 Next.js 文档一致 |
| Project 自动化 JavaScript 测试 | `.github/scripts/project-automation.test.mjs` | 不属于 TypeScript 检查；由 ESLint 与 Node test 负责，不为它开启宽泛 `checkJs` |
| 外部依赖 | `node_modules` | 排除；`skipLibCheck: true` 只跳过声明文件内部检查，不跳过项目代码类型检查 |

仓库约定要求应用单元／集成测试使用 `*.test.ts` 或 `*.test.tsx`，因此后续测试文件无需修改 `tsconfig.json` 即进入类型检查。

## 5. 变更与错误处理

本步骤只在 `package.json` 新增 `typecheck` script，并更新步骤记录。现有 `tsconfig.json` 已满足严格性、覆盖和无输出要求，因此未作无意义改写。

初始 `npx tsc --noEmit` 在已有 `.next` 路由类型时没有报告隐式 `any`、错误导入、不安全赋值或其他类型问题。Day 5 步骤 5 删除 `.next` 后复验发现，单独运行 `tsc` 会因 `src/app/layout.tsx` 使用的全局 `LayoutProps` 尚未生成而失败；`next build` 自身会先生成类型，所以构建不受影响。已依据当前 Next.js 文档将入口修正为 `next typegen && tsc --noEmit`，没有使用宽泛类型、断言或关闭规则绕过问题。

## 6. 验证结果

| 验证 | 预期 | 结果 |
|---|---|---|
| `npx tsc --noEmit` | 已有生成类型时基线检查通过 | 通过 |
| 删除 `.next` 后运行旧入口 | 应暴露对旧生成输出的隐式依赖 | 失败并准确报告缺少 `LayoutProps`；已修复入口 |
| `npm run typecheck` | 先生成路由类型，再独立检查并以退出码 0 完成 | 通过 |
| `npx tsc --showConfig` | `strict` 展开项、include 和 exclude 符合预期 | 通过 |
| 文件集合检查 | 应用、配置、Next.js 类型进入检查 | 通过 |
| `npm run lint` | package script 变更后 lint 仍通过 | 通过 |
| `git diff --check` | 无空白错误 | 通过 |

本步骤没有生成 JavaScript 或声明文件。TypeScript 继续维护 `incremental: true` 对应的 `tsconfig.tsbuildinfo` 本地缓存；该文件已由 `.gitignore` 排除，不属于交付物。本步骤没有修改业务逻辑、数据库、权限或环境值。

## 7. 步骤 3 完成检查

- [x] 已检查 TypeScript 严格性设置；
- [x] 已确认应用代码和必要测试代码进入类型检查范围；
- [x] 已建立可从干净输出运行的独立 `npm run typecheck` 入口；
- [x] 已运行 typecheck；
- [x] 当前不存在隐式 `any`、错误导入或不安全类型错误；
- [x] 未使用宽泛类型或关闭严格规则绕过错误；
- [x] 已再次运行并记录通过结果；
- [x] D5-OI-01 已关闭。

步骤 3 完成。下一步应执行 Day 5 步骤 4“配置测试框架和最小 smoke test”。
