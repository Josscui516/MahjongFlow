# 第 2 天步骤 1：GitHub Project 与工作流配置记录

## 1. 执行结论

第 2 天步骤 1 已于 2026-08-04 完成。MahjongFlow MVP 已建立可用的 GitHub Project、六阶段 Kanban 工作流、规划字段和三个工作视图，并通过虚构测试任务完成全状态流转验证。2026-08-07 又在同一 Project 中补充了 Product Backlog、Current Sprint、User Story 和 Sprint 管理能力；当前运作规则见[《Product Backlog、Sprint Backlog 与 User Story 管理基线》](../../../../product/BACKLOG_AND_SPRINT_MANAGEMENT.md)。

项目地址：<https://github.com/users/Josscui516/projects/5>

## 2. 项目配置

| 项目 | 配置 |
|---|---|
| 名称 | `MahjongFlow MVP` |
| 所有者 | `Josscui516` |
| 可见性 | Private |
| 关联代码仓库 | `Josscui516/MahjongFlow` |
| 项目说明 | MahjongFlow MVP Product Backlog、Sprint Backlog 与 Kanban 执行视图 |

仓库已于 2026-08-06 转移到 Project 所有者 `Josscui516` 名下，原先因为所有者不同
而无法建立仓库级链接的限制已经消失。现有 Issue 和 Pull Request 链接应使用
`Josscui516/MahjongFlow`。本次只确认所有权条件已经满足，没有宣称仓库级 Project
链接已在 GitHub 设置中重新建立；该链接仍需在 Project／仓库设置中单独复核。

## 3. 工作流状态

项目内置 `Status` 字段已按计划配置为：

```text
Backlog → Ready → In Progress → Review → Testing → Done
```

状态使用规则：

- `Backlog`：已记录，但范围、依赖或验收条件尚未满足开始要求；
- `Ready`：范围、依赖和验收条件清晰，可以开始；
- `In Progress`：正在实施，单名成员同时只保留一个主要 Issue；
- `Review`：等待非作者成员审查；
- `Testing`：已通过必要审查，正在执行验收或回归测试；
- `Done`：审查、测试和验收均已完成。

## 4. 字段配置

| 字段 | 类型 | 选项或用途 |
|---|---|---|
| `Status` | Single select | 六阶段工作流，详见上一节 |
| `Priority` | Single select | `P0`、`P1`、`Post-MVP` |
| `Module` | Single select | 八个 P0 业务模块 |
| `Assignees` | GitHub 内置字段 | 记录负责人 |
| `Effort` | Number | 记录相对工作量；具体估算将在 backlog 拆分时填写 |
| `Dependencies` | Text | 记录前置和后续依赖 |
| `Target Development Week` | Single select | `Week 2` 至 `Week 10` |
| `Backlog Rank` | Number | Product Backlog 全局排序 |
| `Story ID` | Text | 追踪 `US-01` 至 `US-06`；横切支撑可映射多个 Story |
| `Item Type` | Single select | `Epic`、`User Story`、`Enabler`、`Bug` |
| `Sprint` | Single select | `Sprint 1` 至 `Sprint 9`；只填写已经承诺的 Sprint |
| `Acceptance Gate` | Single select | `Not checked`、`Incomplete`、`Passed`；由 Issue 验收条件自动派生 |

`Module` 的八个选项为 Foundation & Auth、Meetings、Decision to Task、
Tasks & Dashboard、Events、Registration、Check-in 和 Dinner Verification。

## 5. 视图配置

| 视图 | 布局 | 用途 |
|---|---|---|
| `Kanban by Status` | Board | 默认工作视图，按状态推进任务 |
| `Priority Overview` | Table | 查看优先级、状态、负责人、工作量、依赖、模块和目标周 |
| `Module Overview` | Table | 查看模块、状态、优先级、负责人、工作量、依赖和目标周 |
| `Product Backlog` | Table | 查看全部正式项目，按 `Backlog Rank` 升序排列 |
| `Current Sprint` | Table | 按 `Sprint` 过滤当前承诺范围；当前为 Sprint 2 的 #9、#10、#39、#40、#11、#41 |

`Target Development Week` 表示路线图预测，`Sprint` 表示团队承诺。两者分别
保留，避免把未来周计划误当成已经承诺的 Sprint Backlog。

`Acceptance Gate` 已显示在 Product Backlog、Current Sprint 和 Kanban 卡片中，
方便团队在表格和状态流转视图中直接检查验收条件是否完整通过。

## 6. 权限配置

项目保持为 Private，并向仓库的其他协作者配置 `WRITER` 权限：

- `Caiqwe123`；
- `Scarletthekiller`；
- `Kaia-Zhang`；
- `YUHAN2233`。

GitHub Projects API 已接受全部权限配置请求。`Josscui516` 作为项目所有者保留项目管理权限。

2026-08-07 Week 2 分配同步时，`Kaia-Zhang` 已补充为 Project `WRITER`，与
其仓库 push 权限及 Issue #39 的工作包一致。

## 7. 工作流验证

建立了虚构草稿任务 `[TEST] Validate MahjongFlow project workflow`，未使用任何真实参与者数据。测试任务填写了以下字段：

- Priority：`P0`；
- Module：`Foundation & Auth`；
- Effort：`1`；
- Dependencies：`None — workflow validation only`；
- Target Development Week：`Week 2`。

任务已依次完成以下状态流转：

```text
Backlog → Ready → In Progress → Review → Testing → Done
```

测试时的最终查询确认任务位于 `Done`，所有测试字段均正确保存。步骤 8
复核时，该测试草稿已从 Project 移除。2026-08-07 Week 2 refinement 新增
#39–#41 后，当前 Project 只保留 40 个正式 P0 Issue，不让验证数据混入
Product Backlog。

## 8. 验收结果

- [x] GitHub Project 已创建且可访问；
- [x] 六个计划状态已配置；
- [x] P0、P1 和 Post-MVP 优先级已配置；
- [x] 模块、负责人、工作量、依赖和目标开发周字段已配置；
- [x] Kanban、优先级、模块、Product Backlog 和 Current Sprint 视图已配置；
- [x] Story ID、Item Type、Sprint 与 Backlog Rank 字段已配置；
- [x] Acceptance Gate 字段已配置，并建立严格的状态自动化门禁；
- [x] 仓库协作者已获得项目编辑权限；
- [x] 虚构测试任务已完成全部状态流转，并在验证后移除；
- [x] 未创建 Git 分支、commit、push 或 Pull Request。

## 9. 后续步骤输入

步骤 2 创建 Issue 模板后，应使用模板创建示例 Issue，并把示例加入本
Project。步骤 3 拆分 P0 Backlog 时，所有仓库 Issue 都应填写本记录定义的
字段和状态。

后续自动化的实际配置、状态退回规则、token 安全边界和验证步骤见
[GitHub Project 自动化](../../../../operations/GITHUB_PROJECT_AUTOMATION.md)。
