# GitHub Project 手动维护规则

## 1. 当前决定

从 Sprint 3 起，[MahjongFlow MVP Project #5](https://github.com/users/Josscui516/projects/5)
由 Joshua 手动维护。仓库不再使用 GitHub Actions 或 Project 原生 workflow 自动新增项目项、
推导 `Acceptance Gate`、修改 `Status`／`Sprint`／`Assignee` 或关闭 Issue。

本文件保留原路径，是为了让现有权威文档和历史记录中的链接继续有效；它描述的是当前手动流程，
不表示过去从未使用过自动化。

## 2. 已移除的自动化

- GitHub Actions workflow `Project status automation` 已在 GitHub 停用；
- `.github/workflows/project-status-automation.yml` 已从当前工作树移除；
- `.github/scripts/project-automation.mjs` 及其专项测试已从当前工作树移除；
- Project #5 中原先启用的 `Auto-add sub-issues to project`、`Item added to project` 和
  `Item reopened` workflow 已删除；
- 仅供该自动化使用的 `PROJECT_TOKEN` 已从仓库 Actions secrets 删除；不得尝试恢复、读取或输出其旧值。

## 3. 手动职责

Joshua 负责手动核对和更新：

- Issue 是否属于 Project #5；
- `Status`、`Priority`、`Module`、`Effort`、`Dependencies`、`Target Development Week`；
- `Story ID`、`Item Type`、`Sprint`、`Assignee` 和 `Acceptance Gate`；
- Sprint 总 PR 合并后的 `Done` 与 Issue 关闭状态。

读取 Project 不代表有权写入。除 Joshua 本人操作外，Codex 或其他成员只有在用户明确授权具体
Project 写操作后才能执行；不得把创建 Issue、分支或 PR 的授权扩展为更新 Project 字段。

## 4. 状态门禁

| 目标状态 | 手动更新前必须核对 |
|---|---|
| `Backlog` | Issue 已存在，范围和归属真实；重开项已重新进入 refinement |
| `Ready` | 范围、依赖、验收条件、负责人、工作量、Sprint 和文件所有权已确认 |
| `In Progress` | 已批准开工；assignee 只有一个主要 Issue 在进行；分支基于正确 Sprint 分支 |
| `Review` | 非 Draft PR 可审查；成员 PR 只关联一个主要 Issue，且 base 为 Sprint 分支 |
| `Testing` | 功能自测、必要 checks、非作者批准和 review thread 均满足；成员 PR 已安全进入 Sprint 分支 |
| `Done` | Sprint 总 PR 已经明确授权并合并到 `main`；完整验收、权限、隐私、migration、回滚和部署检查通过 |

不得跳过中间状态。若证据失效、PR 转回 Draft、出现新 commit、批准被撤销或主要 Issue／纳入列表变化，
Joshua 应根据真实状态手动退回 `In Progress` 或 `Review`。

## 5. Acceptance Gate

Joshua 对照 Issue 的 `Acceptance criteria` 段落手动维护：

- `Not checked`：没有可核对的验收 checkbox；
- `Incomplete`：至少一项未勾选，或现有勾选缺少可复验的真实证据；
- `Passed`：所有 checkbox 均完成，并有对应测试、审查或交付证据。

勾选 checkbox 不会自动改变 Project 字段；Project 字段也不能替代 Issue 中的验收证据。

## 6. Sprint 两级 PR 核对

1. 在统一周计划中确认 Sprint 集成分支、集成负责人、主要集成 Issue 和全部工作包 Issues；
2. 手动把完整 Issue 集合加入同一 `Sprint`，并逐项设置 assignee 与起始状态；
3. 成员 PR 合并到 Sprint 分支后，Issue 保持 `Testing`，不得提前关闭；
4. 创建 Sprint 总 PR 前，逐项比较 Project `Sprint` 成员与“主要 Issue + `Included work package issues`”；
5. 若总 PR 引用变化，手动把主要 Issue 退回 `Review`，重新核对后等待新的非作者 review；
6. 总 PR 合并到 `main` 后，逐项确认验收通过，再手动更新为 `Done` 并关闭；
7. 已为 `Done` 的项不重复修改，`Done` 但仍 open 的项继续关闭，失败项记录原因和下一次检查时间。

## 7. 每次手动更新的最小证据

- Issue 编号、assignee、Sprint 和当前／目标状态；
- 分支与 PR 的真实 base／head；
- 实际运行的检查及结果；
- 非作者 review 与未解决 thread 状态；
- Acceptance criteria 与对应证据；
- 权限、隐私、敏感数据、migration、RLS、回滚和部署影响；
- 阻塞原因、负责人、开始时间和下次检查时间（如适用）。

所有截图、fixture、Issue 和 Project 说明只使用虚构或匿名化数据，不记录 token、密钥或真实参与者资料。
