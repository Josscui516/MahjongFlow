# GitHub Project 自动化

## 1. 目的与边界

本自动化负责同步 GitHub Issue、分支、Pull Request 与
[MahjongFlow MVP Project #5](https://github.com/users/Josscui516/projects/5) 的执行状态。
它只管理项目交付元数据，不修改应用代码、数据库、测试 harness 或 Week 2
成员工作包的文件所有权。Issue、Project 与仓库文档的长期职责边界仍以
`AGENTS.md` 和项目权威文档为准。

自动化不会代替 Product Owner 判断：`Backlog → Ready` 必须由团队在确认范围、
依赖、负责人和验收条件后手动完成。其余状态变化必须满足下方门禁。

## 2. Project 原生工作流

Project #5 仅启用以下原生工作流：

| 原生工作流 | 配置 | 原因 |
|---|---|---|
| Auto-add sub-issues to project | On | 保持 Epic 与实施 Issue 的项目可见性 |
| Item added to project | `Status = Backlog` | 新项目项从统一入口开始 |
| Item reopened | `Status = Backlog` | 重开后重新 refinement，不保留虚假的完成状态 |

以下原生工作流保持关闭：Auto-close issue、Item closed、Pull request linked to
issue、Pull request merged、Code review approved、Code changes requested、Auto-add
to project 与 Auto-archive items。它们无法同时验证验收条件、独立审查、CI、
未解决评论和 WIP 限制，启用后可能跳过 `Ready`、`Review` 或 `Testing`。

## 3. 状态与触发条件

| 状态变化 | 触发 | 强制条件 |
|---|---|---|
| `Backlog → Ready` | Project 中手动移动 | 范围、依赖、验收条件、负责人和工作量已确认 |
| `Ready → In Progress` | 创建符合规则的分支 | 创建人是 Issue assignee；该成员没有其他主要 Issue 处于 `In Progress` |
| `In Progress → Review` | 打开非 Draft PR 或将 Draft 标记为 ready | PR 正文和分支只关联一个主要 Issue |
| `Review → Testing` | 非作者提交 Approve review | 至少一个 check 存在且全部通过；无未解决 review thread |
| `Testing → Done` | PR 合并到 `main` | Issue 的 Acceptance Gate 为 `Passed`；独立批准、checks 与 review threads 仍满足要求 |
| `Review/Testing → In Progress` | changes requested、转回 Draft 或未合并关闭 PR | 需要继续实现 |
| `Testing → Review` | 新 commit 推送到 PR 或批准被撤销 | 原审批／测试证据需要重新确认 |
| `任意已关闭项 → Backlog` | Issue reopened | 重新评审范围和完成条件 |

自动化采用比较后更新：当前状态不符合预期前置状态时会失败，不会跨阶段跳转。

## 4. Acceptance Gate

Project 字段 `Acceptance Gate` 有三个选项：

- `Not checked`：Issue 没有 `Acceptance criteria` 标题或该段没有 Markdown checkbox；
- `Incomplete`：该段至少有一个未勾选 checkbox；
- `Passed`：该段所有 checkbox 均为 `[x]` 或 `[X]`。

Issue 的 `opened`、`edited`、`reopened`、`closed` 事件，以及任何相关分支／PR
事件都会重新计算此字段。只有 `Passed` 才允许从 `Testing` 进入 `Done`。
Acceptance criteria 仍是 Issue 中的验收证据；Project 字段只是派生状态，不是第二份事实源。

## 5. 分支与 Pull Request 关联

从 Issue 页面的 Development 区域创建分支，使 GitHub UI 保留原生开发关联；
分支名必须使用：

```text
<type>/<issue-number>-<short-kebab-description>
```

允许的 `type` 为 `feature`、`fix`、`docs`、`test`、`refactor`、`chore` 和
`codex`。Codex 创建分支时继续遵守仓库规则，使用
`codex/<issue-number>-<description>`。

每个 PR 只处理一个主要 Issue，并保留模板中的：

```text
Relates to #39
```

`Relates to` 防止 PR 创建时提前关闭 Issue。只有团队确认 Issue 已在 `Testing`
且全部验收条件已满足时，才可改用 `Closes`、`Fixes` 或 `Resolves`；最终关闭仍
由合并后的门禁结果决定。

## 6. GitHub Actions 配置

自动化文件：

- `.github/workflows/project-status-automation.yml`：声明安全事件入口；
- `.github/scripts/project-automation.mjs`：执行 Project、Issue 和 PR 门禁；
- `.github/scripts/project-automation.test.mjs`：覆盖验收解析、分支关联、checks 与独立审批判断。

用户级 Project 不能由仓库默认 `GITHUB_TOKEN` 写入。仓库管理员必须创建专用、
最小权限 token，并在仓库 `Settings → Secrets and variables → Actions` 中保存为
`PROJECT_TOKEN`。token 必须能读取／更新 Project #5，并能读取本仓库的 Issue、
PR、review 和 check；自动关闭已完成 Issue 时还需要 Issues 写权限。不得把 token
写入仓库文件、Issue、PR、日志或聊天。

`pull_request_target` 事件只 checkout 默认分支中的可信自动化脚本，不 checkout
也不执行 PR 分支代码，避免不受信任的 PR 内容接触 `PROJECT_TOKEN`。

## 7. 启用与验证

代码合并到默认分支并配置 `PROJECT_TOKEN` 后，按以下顺序使用虚构测试 Issue 验证：

1. 创建包含未勾选 Acceptance criteria 的 Issue，确认它进入 `Backlog` 且 Gate 为 `Incomplete`；
2. 手动完成 refinement 后移到 `Ready`；
3. 由 assignee 从 Issue 创建规范分支，确认进入 `In Progress`；
4. 打开一个只关联该 Issue 的 ready-for-review PR，确认进入 `Review`；
5. 运行至少一个 CI check，并由非作者批准且解决所有 review threads，确认进入 `Testing`；
6. 勾选全部 Issue acceptance criteria，确认 Gate 为 `Passed`；
7. 合并到 `main`，确认进入 `Done` 且 Issue 关闭；
8. 删除虚构测试项，避免污染正式 Product Backlog。

若 Actions 失败，应先查看失败日志中的状态前置条件，不应通过手动跳到 `Done`
规避门禁。token 失效时应轮换 secret，不在日志中打印其值。
