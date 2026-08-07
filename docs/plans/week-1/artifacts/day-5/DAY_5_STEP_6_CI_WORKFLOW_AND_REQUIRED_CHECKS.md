# 第 5 天步骤 6：CI 工作流与必需检查验证记录

> 所属计划：[第 5 天：工程质量基线、周验收与下周准备](../../DAY_5_QUALITY_AND_WEEKLY_ACCEPTANCE.md)
> 关联 Issue：[#41 — Establish the M1 test, quality, and acceptance harness](https://github.com/Josscui516/MahjongFlow/issues/41)
> 测试 Pull Request：[#43 — chore: establish quality CI baseline](https://github.com/Josscui516/MahjongFlow/pull/43)
> 执行日期：2026-08-07（Australia/Sydney）
> 状态：步骤 6 完成；D5-OI-02 已关闭，D5-OI-04 因用户临时删除 `main` 规则而重新开放

## 1. 执行结论

已新增 `.github/workflows/quality.yml`，在 Pull Request 和 `main` 更新时按以下依赖顺序运行四个独立、可见的质量检查：

```text
Lint → Typecheck → Test → Build
```

每项检查均在 `ubuntu-latest` 上检出代码，按照 `.nvmrc` 准备 Node.js，使用 `npm ci` 安装锁定依赖，再调用仓库统一 npm script。工作流权限只有 `contents: read`，只提供 localhost URL 和明确标记为 fictional 的无效 publishable key，不读取 GitHub Secret、生产密钥、真实参与者数据或本地 `.env.local`。

Draft PR #43 已完成“初始通过 → 安全临时失败 → 恢复通过”三次远程验证。临时失败准确使 `Test` 返回失败、后续 `Build` 被跳过，并使 PR 处于 `UNSTABLE`；恢复后四项检查再次通过。

本步骤曾为 `main` 启用 branch protection：`Lint`、`Typecheck`、`Test`、`Build` 均为 strict required status checks，对管理员同样生效，force push 和分支删除保持禁用；步骤 10 后续发布又曾补充 required Pull Request、至少 1 名批准、过期审批自动撤销、最后推送者之外的批准和对话解决。用户随后临时删除该规则并明确要求暂不重设，因此 D5-OI-04 重新开放；这里保留已完成的历史验证证据，不把它误报为当前远程状态。

## 2. 工作流设计

| 配置 | 实现 | 目的 |
|---|---|---|
| 触发器 | `pull_request`；`push` 到 `main` | 覆盖合并前验证与基线分支更新 |
| 权限 | `contents: read` | 只允许检出和读取代码 |
| 并发 | workflow + PR number/ref；取消旧 run | 新提交到达后不继续浪费资源验证旧 head |
| 运行时 | `.nvmrc` + `actions/setup-node@v7` | 与仓库 Node.js 版本合同一致 |
| 依赖安装 | 每个 job 执行 `npm ci`，并启用 npm cache | 每项结果可独立审查且严格使用 lockfile |
| 执行顺序 | `needs` 串联四个 job | 上游失败时不运行依赖其正确性的下游检查 |
| CI 环境 | localhost URL + fictional publishable key | 不依赖生产环境或真实数据 |

Actions 版本使用当前 GitHub 文档提供的 `actions/checkout@v6` 与 `actions/setup-node@v7`。每个 job 有独立名称，因此 PR Checks 页面可以分别显示 `Lint`、`Typecheck`、`Test` 和 `Build`。

## 3. 本地前置验证

在创建 PR 前已从锁文件重新安装并按 CI 顺序执行：

| 命令 | 结果 |
|---|---|
| `npm ci` | 通过；411 packages，0 vulnerabilities |
| `npm run lint` | 通过 |
| `npm run typecheck` | 通过；先生成 Next.js 路由类型 |
| `npm test` | 通过；1 file、1 test |
| `npm run build` | 通过；Next.js 16.3.0／Turbopack，4/4 静态页面 |

已知的 `unrs-resolver@1.12.2` allow-scripts 审批提示继续由 D5-OI-07 跟踪；本步骤没有静默批准 lifecycle script。

## 4. 测试 PR 与远程运行结果

| 阶段 | Head commit | Quality run | Lint | Typecheck | Test | Build | PR 结果 |
|---|---|---|---|---|---|---|---|
| 初始基线 | `1e1d619` | [31146032938](https://github.com/Josscui516/MahjongFlow/actions/runs/31146032938) | 通过 | 通过 | 通过 | 通过 | 四项全绿 |
| 临时失败 | `5b4f9d2` | [31146189819](https://github.com/Josscui516/MahjongFlow/actions/runs/31146189819) | 通过 | 通过 | **失败** | 因 `needs: test` 跳过 | `UNSTABLE` |
| 恢复基线 | `f204119` | [31146339592](https://github.com/Josscui516/MahjongFlow/actions/runs/31146339592) | 通过 | 通过 | 通过 | 通过 | 四项全绿 |

Vercel Preview 也在三次 PR head 更新后成功完成；Supabase Preview 明确显示 skipped，不影响本步骤的应用质量门禁。

## 5. 安全临时失败验证

临时 commit `5b4f9d2` 只把 smoke test 的虚构期望 URL 从 `http://localhost:54321` 改为 `http://localhost:9999`，没有修改应用代码、环境文件或外部服务。

验证结果：

1. 本地 `npm test` 返回退出码 `1`；
2. 远程 `Lint` 和 `Typecheck` 先通过；
3. 远程 `Test` 准确报告 1 file／1 test failed，并以退出码 `1` 结束；
4. `Build` 因依赖失败而被跳过；
5. PR 合并状态显示 `UNSTABLE`；
6. 恢复 commit `f204119` 将唯一改动还原，本地测试和最终远程四项检查均再次通过。

失败日志只显示虚构 localhost 配置，没有 token、secret、session、生产 URL 或真实记录。

## 6. `main` 合并门禁

仓库管理员权限允许配置 branch protection，已写入并回读确认：

| 保护项 | 最终值 |
|---|---|
| Strict status checks | 开启；分支必须与 `main` 最新基线一致 |
| Required checks | `Lint`、`Typecheck`、`Test`、`Build` |
| Enforce for administrators | 开启 |
| Force pushes | 禁用 |
| Branch deletion | 禁用 |
| Required pull request reviews | 曾启用并验证；用户随后临时删除全部 `main` 规则，当前未配置 |

这意味着后续 PR 的当前 head 未产生四项成功结果时不能满足 `main` 合并条件。Draft PR #43 没有被合并，也没有被错误标记为完成或 Testing。

## 7. 步骤 6 完成检查

- [x] 已创建针对 Pull Request 和基线分支更新的 CI 工作流；
- [x] 已配置代码检出、运行时和锁定依赖安装；
- [x] 已按顺序执行 lint、typecheck、测试和构建；
- [x] 只使用必要的非敏感虚构 CI 环境变量；
- [x] CI 不使用生产密钥或真实数据；
- [x] 已提交 Draft 测试 PR #43；
- [x] 已检查每个 job 的步骤日志和状态；
- [x] 已制造安全临时失败，确认 Test 失败、Build 跳过和 PR `UNSTABLE`，随后恢复并复验全绿；
- [x] 已将四项检查设为 `main` 的 strict required checks，并对管理员生效；
- [x] D5-OI-02 已关闭。

步骤 6 完成。下一步应执行 Day 5 步骤 7“检查仓库卫生与安全”。
