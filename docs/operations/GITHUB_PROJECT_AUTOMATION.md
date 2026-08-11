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
| `In Progress → Review` | 打开非 Draft 成员 PR 或将 Draft 标记为 ready | PR 正文和分支只关联一个主要 Issue，base 为该 Issue 的 Sprint 分支 |
| `Review → Testing` | 非作者提交 Approve review | 至少一个 check 存在且全部通过；无未解决 review thread |
| `Testing → Testing` | 成员 PR 合并到 Sprint 分支 | Acceptance Gate 为 `Passed`；独立批准、checks 与 review threads 满足要求；等待 Sprint 总 PR |
| `Testing → Review` | 打开 Sprint 总 PR | 所有纳入 Issues 属于同一 Sprint 且均为 `Testing` |
| `Testing → Done` | Sprint 总 PR 合并到 `main` | 主要 Issue 与全部纳入 Issues 的 Gate 为 `Passed`；独立批准、checks 与 threads 仍满足 |
| `Review/Testing → In Progress` | changes requested、转回 Draft 或未合并关闭 PR | 需要继续实现 |
| `Testing → Review` | 新 commit 推送到 PR 或批准被撤销 | 原审批／测试证据需要重新确认 |
| `Testing → Review` | Sprint 总 PR 的主要 Issue 或纳入 Issue 列表被编辑 | 重新核对 Project Sprint 成员，并等待新的非作者 review |
| `任意已关闭项 → Backlog` | Issue reopened | 重新评审范围和完成条件 |

自动化采用比较后更新：当前状态不符合预期前置状态时会失败，不会跨阶段跳转。
Sprint 批量完成采用幂等 reconcile：`Testing` 项迁移到 `Done`，已经为 `Done`
的项跳过状态迁移，`Done` 但仍 open 的项继续关闭。中途失败后重新运行同一 job
即可从已完成位置继续，不会因部分成功而永久阻断。

## 4. Acceptance Gate

Project 字段 `Acceptance Gate` 有三个选项：

- `Not checked`：Issue 没有 `Acceptance criteria` 标题或该段没有 Markdown checkbox；
- `Incomplete`：该段至少有一个未勾选 checkbox；
- `Passed`：该段所有 checkbox 均为 `[x]` 或 `[X]`。

Issue 的 `opened`、`edited`、`reopened`、`closed` 事件，以及任何相关分支／PR
事件都会重新计算此字段。只有 `Passed` 才允许从 `Testing` 进入 `Done`。
Acceptance criteria 仍是 Issue 中的验收证据；Project 字段只是派生状态，不是第二份事实源。

## 5. Sprint 分支与两级 Pull Request

从 Issue 页面的 Development 区域创建分支，使 GitHub UI 保留原生开发关联；
分支名必须使用：

```text
<type>/<issue-number>-<short-kebab-description>
```

允许的 `type` 为 `feature`、`fix`、`docs`、`test`、`refactor`、`chore` 和
`codex`。Codex 创建分支时继续遵守仓库规则，使用
`codex/<issue-number>-<description>`。

每个 Sprint 另有一个不绑定个人 WIP Issue 的集成分支：

```text
sprint/<sprint-number>-<short-kebab-theme>
```

成员 Issue 分支以该 Sprint 分支为 base，成员 PR 也只合并到该 Sprint 分支。

每个成员 PR 只处理一个主要 Issue，并保留模板中的：

```text
Relates to #39
```

成员 PR 始终使用 `Relates to`，防止进入 Sprint 分支时提前关闭 Issue。成员 PR
合并后 Issue 保持 `Testing`。

Sprint 总 PR 从 `sprint/<number>-<theme>` 进入 `main`，以统一周计划指定的集成／验收
Issue 为唯一主要 Issue，并使用以下机器可读章节列出其余项：

```markdown
## Included work package issues

- #9
- #10
```

GitHub Project 的 `Sprint` 字段是 Sprint 成员的权威来源。自动化将 Project 中
属于该 Sprint 的全部仓库 Issues，与“主要 Issue + `Included work package issues`”
进行精确集合比较；缺少或额外声明任何 Issue 都会使门禁失败。PR 正文只声明交付
集合，不得自行改变 Sprint 成员。

修改 Sprint 总 PR 的主要 Issue 或纳入列表会触发 `pull_request_target: edited`。
若主要 Issue 已在 `Testing`，自动化先将其退回 `Review`，再重新验证完整集合；修正
正文后必须收到新的非作者 review 事件才能再次进入 `Testing`。只修改风险说明等
不改变 Issue 引用的文字不会使状态回退。

自动化拒绝个人分支直接进入 `main`、Sprint 不匹配、成员 PR 声明纳入列表、Sprint
总 PR 没有纳入列表、声明集合与 Project Sprint 成员不一致、纳入项未处于
`Testing`／`Done`，以及任何 Gate、checks、审查或 thread 不满足的完成请求。
总 PR 合并后才批量关闭主要 Issue 和纳入 Issues。

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

代码合并到默认分支并配置 `PROJECT_TOKEN` 后，按以下顺序使用一个虚构 Sprint
和至少两个虚构工作包 Issue 验证：

1. 创建包含未勾选 Acceptance criteria 的工作包 Issue，确认它们进入 `Backlog` 且 Gate 为 `Incomplete`；
2. 手动完成 refinement、设置同一 Sprint，并将工作包 Issue 移到 `Ready`；
3. 从最新 `main` 创建虚构 `sprint/*` 分支，再由各 assignee 从该 Sprint 分支创建规范 Issue 分支，确认开始的 Issue 进入 `In Progress`；
4. 分别打开只关联一个 primary Issue、且 base 为 Sprint 分支的成员 PR，确认进入 `Review`；
5. 对每个成员 PR 运行必要 CI check，由非作者批准并解决所有 review threads，确认进入 `Testing`；
6. 勾选各 Issue 的全部 Acceptance criteria，确认 Gate 为 `Passed`；
7. 合并成员 PR 到 Sprint 分支，确认对应 Issue 保持 `Testing` 且没有被关闭；
8. 以集成／验收 Issue 为 primary Issue 创建 `sprint/* → main` 的 Sprint 总 PR，并在 `Included work package issues` 中列出其他工作包 Issue；
9. 分别遗漏一个 Sprint Issue 和额外加入一个非 Sprint Issue，确认两种情况均因与 Project Sprint 成员不一致而失败；
10. 在批准后修改主要 Issue 或纳入列表，确认主要 Issue退回 `Review`，修正正文并取得新 review 后才重新进入 `Testing`；
11. 确认任一纳入 Issue 未处于 `Testing` 时总 PR 被拒绝；全部满足后完成总 PR 的检查、非作者审批与线程解决；
12. 使用虚构项注入一次批量完成中途失败，重新运行同一 job，确认已完成项不重复迁移、`Done` 但 open 的项被关闭、其余项继续完成；
13. 合并 Sprint 总 PR 到 `main`，确认 primary 与全部纳入 Issue 进入 `Done` 并关闭；
14. 删除虚构测试项和远程测试分支，避免污染正式 Product Backlog。

若 Actions 失败，应先查看失败日志中的状态前置条件，不应通过手动跳到 `Done`
规避门禁。token 失效时应轮换 secret，不在日志中打印其值。

重新运行失败的幂等 job 是首选恢复方式。Git revert 只能回退仓库文件，不会撤销
已经写入 GitHub Project 或 Issue 的远程状态；若必须回退已经完成的 Sprint，管理员
需要依据 Actions 日志逐项重新打开 Issue并恢复 Project 状态，然后记录回退原因和
验证结果。

## 8. 仓库管理员在线配置清单

以下操作不能通过本地文件修改完成，必须由有权限的仓库／Project 管理员在 GitHub 执行：

1. 从最新 `main` 创建 `sprint/2-auth-foundation`，并将 PR #45 的 base 从 `main` retarget 到该 Sprint 分支；
2. 在 Project #5 核对 #9、#10、#11、#39、#40、#41 的 `Sprint = Sprint 2`，并将 #41 记录为本 Sprint 集成／验收 Issue；
3. 修正 #10 正文中“unassigned coordination Enabler”与实际 assignee `Josscui516` 的矛盾；
4. 重新核对 #9 已勾选的 Acceptance criteria 与 PR #45 的 `Changes requested`，未有有效证据的项目应恢复为未完成；
5. 为 `main` 配置只允许经审查的 Sprint 总 PR，并为 `sprint/*` 配置只允许经审查的成员 PR；两层均要求必要 Quality checks、`update-project`、至少一名非作者批准、解决所有 review threads、禁止 force push 和删除；
6. 确认 `PROJECT_TOKEN` 可读取／更新 Project #5 和仓库 Issues／PR／reviews／checks，并将本地 Codex／`gh` 的读取凭据增加 `read:project`；需要 Codex 更新 Project 时再单独授予 Project 写权限；
7. 将更新后的自动化合并到默认分支后，用虚构 Sprint 完整验证两层 PR 状态机，再允许真实 Sprint 合并；
8. 核对 Vercel Preview、Supabase Preview／migration 和 Production 只在预期分支触发，避免成员 PR 或 Sprint 分支提前影响生产数据库。
