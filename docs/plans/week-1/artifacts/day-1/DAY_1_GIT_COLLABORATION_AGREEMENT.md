# 第 1 天 Git 与团队协作约定

> 所属计划：[第 1 天：范围确认与技术基线冻结](../../DAY_1_SCOPE_AND_TECH_BASELINE.md)
> 范围基线：[第 1 天范围边界与需求变更规则](DAY_1_SCOPE_BOUNDARIES_AND_CHANGE_CONTROL.md)
> 结构基线：[第 1 天仓库结构与命名基线](DAY_1_REPOSITORY_STRUCTURE_BASELINE.md)
> 确认日期：2026-08-03
> 状态：协作规则已冻结

面向 Codex 的强制执行摘要已同步到仓库根目录的 [`AGENTS.md`](../../../../../AGENTS.md#codex-git-操作规范)；本文件保留完整团队协作基线。

## 1. 当前仓库基线

| 项目 | 当前结论 |
|---|---|
| GitHub 仓库 | `Josscui516/MahjongFlow` |
| 远程名称 | `origin` |
| 基线分支 | `main` |
| 工作方式 | Issue → 短生命周期分支 → Pull Request → Review → Testing → Merge |
| 项目板状态 | `Backlog → Ready → In Progress → Review → Testing → Done` |
| `.github` 模板 | 第 2 天创建，不在本步骤提前执行 |
| CI 与远程分支保护 | 第 5 天配置和验证；配置前仍须执行本约定中的人工检查 |

`main` 是可部署基线。禁止直接在 `main` 上完成日常功能或修复；远程设置允许后，应要求 Pull Request、至少一名审查者和必需状态检查。

## 2. 开始任务的条件

成员只有在以下条件全部满足时才能把主要任务移入 `In Progress`：

1. 已有一个 GitHub Issue；
2. Issue 明确关联 P0、P1 或 Post-MVP 范围 ID；
3. 已写明用户价值和可测试验收条件；
4. 依赖已满足，或未满足依赖已明确记录；
5. 已指定主要负责人和建议审查人；
6. 已给出工作量估算；
7. 该负责人当前没有另一个主要任务处于 `In Progress`；
8. 从最新 `main` 创建了一个短生命周期分支。

任何缺少验收条件或范围归属的 Issue 不得进入 `Ready`。

## 3. 分支规则

### 3.1 命名格式

团队成员使用：

```text
<type>/<issue-number>-<short-kebab-description>
```

| 类型 | 用途 | 示例 |
|---|---|---|
| `feature/` | 新增用户可见能力 | `feature/42-meeting-to-task` |
| `fix/` | 修复缺陷 | `fix/57-attendance-permission` |
| `docs/` | 仅文档变更 | `docs/18-setup-guide` |
| `test/` | 仅测试或 fixture | `test/61-event-workflow` |
| `refactor/` | 不改变行为的代码整理 | `refactor/73-task-queries` |
| `chore/` | 工具、依赖或配置 | `chore/9-ci-baseline` |
| `codex/` | Codex 桌面任务创建的受控分支 | `codex/42-meeting-to-task` |

规则：

- 描述使用小写英文和连字符；
- 必须包含 Issue 编号；
- 一个分支只解决一个主要 Issue；
- 不使用成员姓名、`new`、`update`、`final` 等无法说明范围的名称；
- 分支目标生命周期不超过两个工作日；超过时必须拆分、更新 Issue 或说明阻塞；
- 合并后删除远程功能分支；不得长期复用已合并分支。

### 3.2 分支同步

- 创建分支前获取最新 `main`；
- 打开 PR 前再次同步 `main` 并解决冲突；
- 不对其他成员正在使用的共享分支执行强制推送；
- 已进入审查的分支若必须重写历史，应先通知审查人；
- 不使用会删除他人未提交工作的命令处理冲突。

## 4. Commit 规则

Commit 使用以下格式：

```text
<type>: <imperative summary>
```

允许的 type 为 `feat`、`fix`、`docs`、`test`、`refactor`、`chore`。

示例：

```text
feat: link meeting decisions to tasks
fix: reject duplicate attendance records
docs: record repository structure baseline
```

- 每个 commit 保持单一目的并可审查；
- 摘要使用英文祈使语气，不加句号；
- 不提交调试输出、临时注释、无关格式化或个人配置；
- 修复审查意见时优先产生清晰的小 commit，合并策略由仓库设置决定；
- commit 信息不得包含密钥、真实参与者资料或其他敏感内容。

## 5. Pull Request 必填内容

每个 PR 必须包含：

| 字段 | 要求 |
|---|---|
| 关联 Issue | 使用可自动关闭或明确关联的 Issue 编号 |
| 范围 | 列出 P0/P1/Post-MVP ID；没有范围 ID 时说明原因 |
| 变更摘要 | 说明做了什么以及为什么 |
| 验收标准 | 逐项引用并勾选对应验收场景 ID |
| 测试证据 | 记录执行命令、结果和必要的手动路径 |
| 权限与隐私 | 说明是否涉及角色、敏感字段、公开入口或密钥 |
| 数据库变更 | 说明 migration、约束、RLS、回滚和生成类型影响 |
| UI 状态 | 说明 loading、empty、success 和 error 行为；不适用时写明理由 |
| 截图／录屏 | 只在界面变化时提供，且必须使用虚构数据 |
| 风险与回退 | 说明主要风险和安全回退方法 |

PR 描述不得只写 Issue 链接或“完成了”。审查人必须能仅根据 PR、Issue 和链接文档判断是否满足验收标准。

## 6. 审查与合并规则

1. PR 作者先完成自查和相关测试，再请求审查；
2. 至少一名非作者成员批准；作者不能批准自己的 PR；
3. 涉及数据库、RLS、认证、参与者数据或签到 token 的 PR，审查人必须明确检查安全与数据影响；
4. 审查意见分为阻塞问题、建议和问题说明；阻塞问题解决前不得合并；
5. 作者回应每项审查意见，修复后重新请求必要审查；
6. PR 进入 `Review` 时必须已有可审查实现，不把空 PR 当作完成进度；
7. 审查通过后进入 `Testing`，按验收场景执行验证；
8. 所有必需检查通过、无未解决阻塞意见后才能合并到 `main`；
9. 合并后确认 Issue、项目板、文档和部署状态，再判断是否进入 `Done`；
10. 不因排期紧张跳过权限、数据约束或核心回归测试。

审查请求应在一个工作日内得到首次回应；无法及时审查时，审查人应主动转交给其他成员，避免 PR 静默等待。

## 7. 数据库与权限变更规则

任何涉及数据库 schema、数据关系、认证或权限的 PR 必须同时包含：

- timestamped SQL migration；
- 外键、唯一约束、检查约束或索引的说明；
- 新增或修改的 RLS policy；
- 普通委员会、授权人员和匿名会话的允许／拒绝测试；
- migration 回滚说明，或不可逆时的备份与恢复步骤；
- 对虚构 seed data 的影响；
- 重新生成 `src/types/database.generated.ts` 的结果；
- 对已有数据和部署顺序的影响。

禁止只在 Supabase Dashboard 手工修改远程 schema 或 policy。紧急远程修正也必须立即补回 migration，并在合并前核对远程与仓库状态一致。

## 8. 密钥、配置与真实数据

以下内容禁止进入 commit、Issue、PR 描述、截图、测试日志或聊天复制内容：

- `.env`、`.env.local`、`supabase/.env*` 和真实 Vercel/Supabase 配置；
- Supabase secret/service-role key、access token、密码和 session；
- 真实参与者姓名、邮箱、学号、报名、签到或晚餐资格；
- 未脱敏数据库 dump、生产日志或备份；
- 含有上述信息的截图、录屏和 CI artefact。

只允许提交 `.env.example` 中的变量名和无效示例值。开发、演示、截图和自动化测试只使用虚构或匿名化数据。

若敏感信息误提交：

1. 立即停止分享相关 commit 或 PR；
2. 通知团队并撤销／轮换受影响凭据；
3. 评估历史清理和数据暴露范围；
4. 记录事件及修复；
5. 不得仅删除当前文件后继续使用已泄露凭据。

## 9. WIP 限制

- 每名成员同时只能有一个主要 Issue 处于 `In Progress`；
- Review 工作不计作第二个主要实现任务，但应优先避免阻塞他人；
- 小型非阻塞文档修正可并行，但不得掩盖主要任务停滞；
- 新任务开始前，应先将当前主要任务推进到 `Review`、退回 `Ready` 或明确标记阻塞；
- 项目协调者每天检查 WIP 超限，发现后要求合并、拆分或重新排序。

## 10. 阻塞记录与升级

阻塞出现时立即在 Issue 中记录，不等待满一个工作日。记录必须包含：

| 字段 | 内容 |
|---|---|
| 阻塞原因 | 可观察的问题或缺少的输入 |
| 影响 | 受影响的 P0、验收条件、人员和排期 |
| 已尝试操作 | 已执行的诊断或协调动作及结果 |
| 所需帮助 | 需要谁提供什么决定、权限或技术支持 |
| 负责人 | 继续推动解决的人 |
| 开始时间 | 阻塞首次出现时间 |
| 下次检查时间 | 下一次明确跟进点 |

若阻塞持续超过一个工作日：

1. 在 GitHub Issue／Project 增加 `blocked` 标签或等效字段，原 Kanban 状态保持真实；
2. 在当日团队同步中升级；
3. 由项目协调者确认重新分配、拆分、替代路径或范围处理；
4. 若影响 P0、权限、安全或里程碑，将其加入风险／决策记录；
5. 不得在没有负责人和下一次检查时间的情况下静默顺延。

## 11. 项目板状态转换

| 当前状态 | 进入下一状态的条件 | 下一状态 |
|---|---|---|
| `Backlog` | 范围、价值、初步描述已记录 | `Ready`（经 refinement 后） |
| `Ready` | 验收条件、依赖、负责人、估算齐备 | `In Progress` |
| `In Progress` | 实现、自查和 PR 描述齐备 | `Review` |
| `Review` | 非作者审查批准，阻塞意见已解决 | `Testing` |
| `Testing` | 自动和手动验收通过，文档与部署要求满足 | `Done` |

失败的 Review 或 Testing 返回 `In Progress`，并在 Issue 中记录原因。`Done` 只表示满足 Definition of Done，不等同于“代码已写完”。

## 12. 日常操作流程

```text
选择 Ready Issue
→ 确认验收条件和依赖
→ 指定负责人及审查人
→ 创建短生命周期分支
→ 实现并本地验证
→ 打开关联 Issue 的 PR
→ 非作者审查
→ Testing 验收
→ 合并 main
→ 更新 Issue、项目板、文档和部署状态
```

## 13. 当前待后续执行项

以下事项已有规则，但按周计划在后续步骤实施：

| 项目 | 计划执行时间 |
|---|---|
| GitHub Project 与 Kanban 字段 | 第 2 天 |
| Issue 和 Pull Request 模板 | 第 2 天 |
| feature、bug 等标签 | 第 2 天 |
| lint、typecheck、测试和构建命令 | 第 5 天 |
| CI workflow 与必需状态检查 | 第 5 天 |
| `main` 远程分支保护 | 第 5 天配置并验证 |

### 13.1 2026-08-06 所有权转移与自动部署补充

仓库已转移至 `Josscui516/MahjongFlow`，默认分支仍为 `main`。Vercel Production 与
Supabase GitHub integration 均监听 `main`；因此合并或直接推送到 `main` 可能同时触发
应用生产部署和数据库 migration。审计时 `main` 尚未配置 branch protection／ruleset。
该保护必须在 Week 2 业务开发前完成：要求 Pull Request、至少一名非作者批准、禁止
force push 和删除，并在第 5 天 CI 可用后加入必需状态检查。2026-08-07 后续发布已
完成该项：四项 strict checks、至少 1 名批准、过期审批自动撤销、最后推送者之外的
批准、对话解决和管理员执行均已启用，force push 与分支删除保持禁用。用户随后为
处理其他问题临时删除全部 `main` 规则，并明确要求当前发布完成后暂不重设；因此这些
设置保留为已验证目标基线，但不是当前远程状态，D5-OI-04 重新开放。

## 14. 步骤 7 完成检查

- [x] 已约定短生命周期功能分支和命名方式；
- [x] 已规定每个 PR 关联 Issue、范围和验收标准；
- [x] 已规定至少一名非作者成员审查；
- [x] 数据库和权限变更必须包含 migration、回滚说明及权限测试；
- [x] 已禁止提交或传播密钥、生产配置和真实参与者数据；
- [x] 每人同时处于 `In Progress` 的主要任务不超过一个；
- [x] 阻塞超过一个工作日必须标记并升级；
- [x] 已明确从开始任务到合并和 `Done` 的完整流程。
