# Sprint 6 验收复核（2026-09-15）

> 当前状态已由 [2026-09-15 最终集成验收](SPRINT_6_FINAL_ACCEPTANCE_20260915.md) 更新。下文保留为历史记录，其中缺口和审查门禁不代表最终状态。

## 结论

本轮未通过最终验收，未执行远程合并、关闭 Issue 或标记 Done。用户已授权符合条件后的合并及 Project 更新；当前未满足功能集成和独立审查条件。

## 范围与版本

- 依据 main 中的开发第 6 周统一计划及五份成员文档、MVP 课程第 7 周要求，实时 Project 成员精确为 #5、#17、#18、#19、#26、#27、#28。
- 六个功能分支 tip 均已包含于 Sprint 分支 `74ce81b62857dc1d8249466a7bfeab0e026df673`；对应 PR #73/#74/#75/#77/#79/#80 已合并。没有发现遗漏的未开 PR 的 Sprint 6 功能提交。
- 唯一打开的验收 PR 为 #81，head 为 `0a11cc88d98b68fc4d076899c8b1f20270ff52c8`。
- 当前 main 为 `93ac15a`，已包含 Sprint 5 总 PR #83。#81 内关于 #72/#78 仍打开的历史说明已过时。
- #6 和未来 #29 不在本次关闭集合中。

## 功能覆盖及缺口

| 范围 | 复核结论 |
|---|---|
| 两类活动创建、详情、更新与校验 | 实现及相关测试存在；#81 静态检查、应用测试和生产构建通过 |
| 筹备任务关联、解除、0/0 与完成比例 | 真实 provider 已接入活动页；候选仅第一页 20 条为已有非阻断限制，任务编辑器提供关联入口 |
| Dashboard 真实近期活动、任务活动筛选 | #81 已接真实 provider；与当前 main 的最终组合仍有冲突，不能认定组合验收通过 |
| 最少身份、报名去重、取消／恢复 | 授权服务、名单、数据库约束及测试存在；既有 #73 缺少独立批准记录 |
| 报名与签到分离、隐私确认 | 独立数字服务和报名页显示存在；既有 #77 缺少独立批准记录 |
| 普通委员会安全人数展示 | **未完成页面集成**：唯一 ParticipationSummary 挂载点为授权报名页，普通委员会在名单授权检查时已经被拒绝；活动详情未挂载计划要求的安全数字组件 |

人数展示属于接口／集成缺陷：Li 的成员计划步骤 2 明确负责在活动路由挂载 Yubo 的安全数字组件。负责 Issue 为 #17 / Li，#5 / Joshua 跟踪验收；#28 已提供数字组件和窄服务，不应要求 Yubo 越界修改活动页面。本缺口阻止 Sprint 总体验收，不属于 #81 新引入的功能回归。

复验：committee 打开活动详情可以看到报名／签到独立数字及零值、加载、错误状态；页面响应不含身份字段，报名名单仍拒绝访问。

## main 集成与 review 门禁

在独立 detached worktree 中将当前 main 试合并到 #81，产生八个冲突文件：

- `src/app/(dashboard)/tasks/[taskId]/edit/page.tsx`
- `src/features/dashboard/DashboardView.tsx`
- `src/features/dashboard/upcoming-events/UpcomingEventsPanel.tsx`
- `src/features/tasks/core/repository.ts`
- `src/features/tasks/core/repository.test.ts`
- `src/features/tasks/editor/TaskEditor.tsx`
- `src/features/tasks/editor/actions.ts`
- `src/features/tasks/list/TaskList.tsx`

试合并已安全 abort。#5 集成负责人需协调文件所有者，保留 Sprint 5 筛选／返回上下文、完成操作和刷新逻辑，以及 Sprint 6 活动关联和真实近期活动，再复验最终 SHA。此项阻止 Sprint 到 main 合并，不代表 #81 到现有 Sprint base 存在 Git 冲突。

#81 无非作者批准，#73/#77 也无历史批准记录；#74/#75/#79/#80 有批准。Codex 工程检查不等于团队成员批准。交付 skill 的明确门禁为 “Require non-author review and Testing before each merge.”；最终 Sprint 总 PR 仍需独立审查。

## 验证证据和边界

| 本轮实际执行 | 结果 |
|---|---|
| `npm run lint` | 通过 |
| `npm run typecheck` | 通过 |
| `npm test` | 98 个应用套件、571 项应用测试及 5 项脚本测试通过 |
| `npm run test:acceptance` | 149 项通过，是上述应用测试的子集 |
| `node node_modules/next/dist/bin/next build --webpack` | 使用虚构 CI 配置通过；不代表部署验证 |
| 与当前 main 试合并 | 八个文件冲突，已 abort |
| `git diff --check` | 证据日志及 provision.cjs 有空白告警，待非功能性清理 |

实时核对 GitHub Quality run `34945900289` 对应同一 #81 head：lint、types、test、Database、build 全部成功；Database 步骤包括无 seed／有 seed 重放、SQL、双连接并发、schema lint 和 drift 检查。Supabase Preview 被跳过。

本轮未重跑真实浏览器、数据库重置、并发及备份恢复；9 月 10 日相关记录属于历史证据，不能替代解决冲突后最终组合的运行证明。未操作远程数据库，也未使用当前正在运行的本地数据库做破坏性 reset。

## Project 和后续交接

- #18/#19/#26：依据已有独立批准和检查证据，改为 Testing。
- #5/#17/#27/#28：改为 Review；分别等待整体集成、页面挂载和报名独立审查。
- 七项 Acceptance Gate 保持 Incomplete；不提前 Done 或关闭。
- 详细英文复核已追加到 Issue #5，并以普通工程 review 留在 PR #81；未冒充批准。
- 阻塞开始：2026-09-15 Australia/Sydney；下次检查：2026-09-16 23:00 Australia/Sydney；负责人：Joshua。
- 所需协作：Li 完成数字组件挂载；Joshua 协调冲突解决；非作者成员复核报名及验收工作。解决后运行全量集成、浏览器、权限、数据库及恢复检查，再重新判断总 PR 条件。

原工作区业务文件未修改；本文件为本轮新增、未提交的审查记录。独立复核目录位于相邻的 `MahjongFlow-sprint6-audit`，停留在 #81 head，无未完成 merge。
