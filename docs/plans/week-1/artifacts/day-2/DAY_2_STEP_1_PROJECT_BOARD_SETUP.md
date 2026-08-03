# 第 2 天步骤 1：GitHub Project 与工作流配置记录

## 1. 执行结论

第 2 天步骤 1 已于 2026-08-04 完成。MahjongFlow MVP 已建立可用的 GitHub Project、六阶段 Kanban 工作流、规划字段和三个工作视图，并通过虚构测试任务完成全状态流转验证。

项目地址：<https://github.com/users/Josscui516/projects/5>

## 2. 项目配置

| 项目 | 配置 |
|---|---|
| 名称 | `MahjongFlow MVP` |
| 所有者 | `Josscui516` |
| 可见性 | Private |
| 关联代码仓库 | `Caiqwe123/MahjongFlow` |
| 项目说明 | 追踪已批准的 P0、P1 和 Post-MVP 工作，并遵循 9 周实现计划 |

GitHub 只允许 Project 与同一所有者名下的仓库建立仓库级链接。由于 Project 所有者为 `Josscui516`，仓库所有者为 `Caiqwe123`，平台拒绝建立仓库级链接。该限制不影响把 `Caiqwe123/MahjongFlow` 的 issue 和 Pull Request 添加到项目中；后续步骤应直接把仓库工作项加入此 Project。

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
| `Status` | Single select | `Backlog`、`Ready`、`In Progress`、`Review`、`Testing`、`Done` |
| `Priority` | Single select | `P0`、`P1`、`Post-MVP` |
| `Module` | Single select | Foundation & Auth、Meetings、Decision to Task、Tasks & Dashboard、Events、Registration、Check-in、Dinner Verification |
| `Assignees` | GitHub 内置字段 | 记录负责人 |
| `Effort` | Number | 记录相对工作量；具体估算将在 backlog 拆分时填写 |
| `Dependencies` | Text | 记录前置和后续依赖 |
| `Target Development Week` | Single select | `Week 2` 至 `Week 10` |

## 5. 视图配置

| 视图 | 布局 | 用途 |
|---|---|---|
| `Kanban by Status` | Board | 默认工作视图，按状态推进任务 |
| `Priority Overview` | Table | 查看优先级、状态、负责人、工作量、依赖、模块和目标周 |
| `Module Overview` | Table | 查看模块、状态、优先级、负责人、工作量、依赖和目标周 |

## 6. 权限配置

项目保持为 Private，并向仓库的其他协作者配置 `WRITER` 权限：

- `Caiqwe123`；
- `Scarletthekiller`；
- `YUHAN2233`。

GitHub Projects API 已接受全部权限配置请求。`Josscui516` 作为项目所有者保留项目管理权限。

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

最终查询确认任务位于 `Done`，所有测试字段均正确保存。该任务保留在项目中，作为步骤 1 的可见验收证据。

## 8. 验收结果

- [x] GitHub Project 已创建且可访问；
- [x] 六个计划状态已配置；
- [x] P0、P1 和 Post-MVP 优先级已配置；
- [x] 模块、负责人、工作量、依赖和目标开发周字段已配置；
- [x] 状态、优先级和模块工作视图已配置；
- [x] 仓库协作者已获得项目编辑权限；
- [x] 虚构测试任务已完成全部状态流转；
- [x] 未创建 Git 分支、commit、push 或 Pull Request。

## 9. 后续步骤输入

步骤 2 创建 issue 模板后，应使用模板创建示例 issue，并把示例加入本 Project。步骤 3 拆分 P0 backlog 时，所有仓库 issue 都应填写本记录定义的字段和状态。
