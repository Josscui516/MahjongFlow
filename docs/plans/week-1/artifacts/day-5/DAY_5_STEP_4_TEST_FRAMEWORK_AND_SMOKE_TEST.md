# 第 5 天步骤 4：测试框架与 smoke test 验证记录

> 所属计划：[第 5 天：工程质量基线、周验收与下周准备](../../DAY_5_QUALITY_AND_WEEKLY_ACCEPTANCE.md)
> 遗留输入：[步骤 1：遗留问题与风险分级清单](DAY_5_STEP_1_OUTSTANDING_ISSUES_AND_RISKS.md)
> 执行日期：2026-08-07（Australia/Sydney）
> 状态：步骤 4 完成；D5-OI-02 的本地测试部分已完成，CI 部分留待步骤 6

## 1. 执行结论

项目已采用 Vitest 4.1.10 作为 TypeScript 单元与集成测试框架，并建立统一非交互入口：

```text
npm test → vitest run
```

已添加一个不访问网络、不读取真实环境值的最小 smoke test，验证现有 Supabase 公共环境解析能够读取虚构的本地配置并移除 URL 末尾斜杠。测试成功、故意失败和恢复后的再次成功均已验证，命令行可用退出码区分通过与失败。

## 2. 选择依据

- 已读取当前安装版本的 Next.js 文档：`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`；
- 已通过 Context7 查询 Vitest 4.1 文档，并在安装时锁定当前可用版本 4.1.10；
- Vitest 原生支持 ESM、TypeScript、单次 `run` 模式和 Vite path alias，适合当前 Next.js／TypeScript 工具链；
- 当前 smoke test 是 Node 环境纯逻辑测试，不渲染组件，因此不提前安装 jsdom、React Testing Library 或浏览器驱动；
- Next.js 当前文档说明 Vitest 不支持异步 Server Component 单元测试；这类行为后续使用集成或端到端测试，不制造假覆盖。

最初评估了 `vite-tsconfig-paths`，但其当前依赖树引入已停止维护的 `tsconfck`。项目只有一个稳定别名，因此改用 Vitest/Vite 原生 `resolve.alias`，并移除该插件及其三个传递包。

## 3. 配置与目录约定

配置文件为仓库根目录的 `vitest.config.mts`：

- 测试环境：`node`；
- `@` 映射到 `src/`，与 `tsconfig.json` 一致；
- 每个测试之间自动清理 mock，并恢复被替换的实现；
- 使用显式 `vitest` imports，不启用全局测试 API。

| 测试类型 | 位置与命名 | 当前入口 |
|---|---|---|
| 单元测试 | `tests/unit/**/*.test.ts(x)` | Vitest |
| 集成测试 | `tests/integration/**/*.test.ts(x)` | Vitest |
| 可复用源码旁测试 | `src/**/*.test.ts(x)` | Vitest；只在确有局部职责时使用 |
| 端到端测试 | `tests/e2e/**/*.spec.ts` | 不由当前 Vitest 入口误收集；后续步骤选择浏览器工具 |
| 数据库约束／RLS | `supabase/tests/**/*.sql` | 不由 Vitest 执行；保留 Supabase 数据库入口 |

## 4. Smoke test

文件：`tests/unit/supabase-environment.test.ts`。

测试行为：

1. 使用 `vi.stubEnv` 注入虚构的 localhost URL 与无效示例 publishable key；
2. 调用现有纯配置边界 `getSupabasePublicEnvironment()`；
3. 验证返回字段正确且 URL 末尾斜杠被移除；
4. 每个测试结束后恢复进程环境。

测试不调用 `fetch`、Supabase、Vercel 或任何生产服务，不需要 `.env.local`，也不包含真实 URL、密钥或参与者资料。

## 5. 成功与失败识别

| 阶段 | 操作 | 结果 |
|---|---|---|
| 可控失败 | 临时把预期 URL 改为 `http://localhost:9999` | 1 个测试失败；Vitest 退出码 `1` |
| 恢复 | 将预期恢复为虚构输入对应的 `http://localhost:54321` | 故意失败未保留 |
| 最终复验 | `npm test` | 1 个文件、1 个测试通过；退出码 `0` |

失败输出准确显示 expected/received 差异，因此后续 CI 能识别失败而不会假通过。

## 6. 依赖与安全检查

- 新增直接开发依赖：`vitest` 4.1.10；
- `package-lock.json` 已由 npm 更新；
- 安装后共审计 411 个 package，报告 0 个漏洞；
- 已知的 `unrs-resolver@1.12.2` lifecycle-script 审批提示仍对应 D5-OI-07，本步骤没有静默批准脚本；
- 测试配置不要求生产密钥或真实数据。

## 7. 最终验证

| 命令 | 结果 |
|---|---|
| `npm test` | 通过；1 file、1 test |
| `npm run typecheck` | 通过；测试与 `vitest.config.mts` 均进入类型检查 |
| `npm run lint` | 通过；测试与配置均进入 lint |
| `git diff --check` | 通过 |

生产构建不属于本步骤，留给 Day 5 步骤 5 在清理构建输出后独立验证。

## 8. 步骤 4 完成检查

- [x] 已根据当前技术栈选择测试框架；
- [x] 已建立测试配置和统一 `npm test` 入口；
- [x] 已遵循冻结的测试目录与命名约定；
- [x] 已添加验证现有基础行为的最小 smoke test；
- [x] 测试不依赖真实外部数据或生产服务；
- [x] 测试已运行并通过；
- [x] 已制造可控失败并确认非零退出码；
- [x] 已恢复测试并再次运行通过；
- [x] D5-OI-02 的本地测试部分已完成，CI 部分仍保持开放。

步骤 4 完成。下一步应执行 Day 5 步骤 5“验证生产构建”。
