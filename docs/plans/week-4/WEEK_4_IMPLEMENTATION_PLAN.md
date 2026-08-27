# 课程第 5 周（开发第 4 周）：决策转任务与 Sprint 4 阶段评审

> 本计划依据[《MVP 项目企划书》](../../project/MVP_PROJECT_PROPOSAL.md)编制。本周只交付 `US-02`、`CONV-01` 至 `CONV-05`、任务基础能力 `TASK-01` 至 `TASK-02`，并完成课程第 5 周唯一一次开发期 Stakeholder 阶段评审；不提前实现 Dashboard、临期／逾期、活动或参与者数据能力。

## 1. 本周目标

形成可演示、可追踪的“会议 → 决策／讨论点 → 任务”流程：委员会用户可以创建、查看、更新和受控删除任务，按标题／描述搜索、按状态筛选并调整基础排序；从会议决策或讨论点打开带来源上下文的任务表单，保存单一负责人、截止日期和受约束状态，并在会议与任务之间双向导航。四个功能工作包完成后，Joshua 最后执行 Sprint 4 集成、`C-01` 至 `C-07` 验收、质量门禁和 Stakeholder 阶段评审。

### Sprint 交付路线

- GitHub Sprint：`Sprint 4`；
- Sprint 集成分支：`sprint/4-decision-to-task`；
- 集成负责人：Joshua；Joshua 只在 Li、Xuanwei、Shiying、Yubo 的功能工作包进入 `Testing` 后开始 Sprint 收尾；
- Sprint 总 PR 主要 Issue：#3；
- Sprint 总 PR 路线：`sprint/4-decision-to-task` → `main`；
- 其余纳入工作包 Issues：#15、#23、#24、#25；
- 远程分支、Project 字段和分支保护负责人：仓库管理员 `Josscui516`；`Sprint`、`Status`、`Assignee`、`Acceptance Gate` 均由 Joshua 手动维护；
- 2026-08-23 只读核对结果：#3、#15、#23、#24、#25 均为 open／`Backlog`，Project 尚未显示 Sprint、assignee 或已通过的 Acceptance Gate；开始前必须由 Joshua 按真实状态手动补齐，不得把本计划当作 Project 已更新的证据。

### 成员独立工作文档

- [Li：任务基础 CRUD 与状态约束](LI_WEEKLY_WORK_PLAN.md)
- [Xuanwei：来源保留与决策／讨论点转任务](XUANWEI_WEEKLY_WORK_PLAN.md)
- [Shiying：转换字段校验与单一负责人](SHIYING_WEEKLY_WORK_PLAN.md)
- [Yubo：会议与来源任务双向导航](YUBO_WEEKLY_WORK_PLAN.md)
- [Joshua：Sprint 4 集成、验收与阶段评审](JOSHUA_WEEKLY_WORK_PLAN.md)

### GitHub Project 分配

| 顺序 | 成员 | GitHub 账号 | 主要 Issue | 工作包 |
|---|---|---|---|---|
| 1 | Li | `Kaia-Zhang` | #15 | WP-A 任务基础 CRUD、持久化与状态约束 |
| 2 | Xuanwei | `YUHAN2233` | #23 | WP-B 来源上下文、转换入口与来源持久化 |
| 3 | Shiying | `Scarletthekiller` | #24 | WP-C 转换校验、单一负责人和失败原子性 |
| 4 | Yubo | `Caiqwe123` | #25 | WP-D 来源任务双向导航与安全缺失状态 |
| 5 | Joshua | `Josscui516` | #3 | WP-E 跨包验收、Sprint 集成、阶段评审与收尾 |

## 2. 上周输入与开始条件

- Sprint 3 的会议创建、详情、讨论点、决策和历史能力必须已通过总体验收并合入 `main`；若 Sprint 3 仍未完成，Sprint 4 只能做只读合同准备，不得把依赖描述为 Ready；
- #12、#13 的公开会议／议程合同与 #15 的 task schema、RLS、索引基线可重用；不得重建 `tasks` 表或重写 Week 2 migration；
- Joshua 必须在 GitHub Project 中手动核对 #3、#15、#23、#24、#25 的 `Sprint 4`、负责人、依赖、状态和 Acceptance Gate，并确认每人只有一个主要 Issue 进入 `In Progress`；
- `sprint/4-decision-to-task` 必须经明确授权从最新 `main` 创建；成员分支从该 Sprint 分支创建，成员 PR 均以该 Sprint 分支为 base；
- 周初冻结 `TaskEditorPort`、`TaskRecordDTO`、`TaskSourceContext`、`TaskConversionPort`、转换校验结果和两个导航插槽；消费者在提供者尚未集成时使用类型、mock 或 fixture 独立推进；
- 编写 Next.js 代码前，各实现者必须读取当前安装版本 `node_modules/next/dist/docs/` 中与 Server Components、Server Actions／forms、dynamic routes、loading／error 和 navigation 对应的文档；
- 所有开发、测试、截图和演示只使用虚构或匿名化数据。

## 3. 本周范围

### 3.1 必须完成

- #15：任务创建、查看和更新，单一负责人、截止日期、三种持久化状态、服务端授权、RLS、刷新持久化以及 T-01／T-02／T-08；
- #23：从决策或讨论点打开任务表单，预填来源上下文，只创建一条任务并持久化会议及适用来源，覆盖 C-01／C-02／C-05／C-07；
- #24：转换任务必须具有标题、描述、单一负责人、截止日期和允许状态；失败不创建部分任务且保留来源上下文，覆盖 C-02／C-03／C-06；
- #25：会议页展示关联任务，任务页返回来源会议并显示决策／讨论点上下文；缺失或无权来源使用安全反馈，覆盖 C-04／C-07；
- #3：前四个功能工作包进入 `Testing` 后，由 Joshua 建立 `C-01` 至 `C-07` 跨包 harness 和虚构 fixture，执行完整集成、回归、权限、migration／RLS 复核，形成 `US_02_ACCEPTANCE_RECORD.md`、阶段评审材料和 Sprint 总 PR 证据。

### 3.2 条件允许时完成

- 对任务和转换表单执行窄屏、键盘顺序、错误摘要焦点与状态非纯色表达检查；
- 提供稳定只读的 `TaskRecordDTO`，实现标题／描述搜索、状态筛选和基础排序；为开发第 5 周 #16、#20 保留临期、逾期、Dashboard、活动和负责人等高级筛选扩展点。

### 3.3 明确不做

- 不实现 #16、#20、#21、#22 的 Sydney 临期／逾期分类、Dashboard、活动／负责人高级筛选或站内提醒；
- 不实现活动、报名、签到、晚餐核验、外部通知、多负责人、子任务或复杂依赖；
- 不把 `Overdue` 加入可选择或持久化的任务状态；
- 不修改参与者敏感数据权限，也不向 Client Component 暴露 server-only 模块或完整数据库记录；
- 不重写既有 migration；schema、约束或 RLS 缺口只能通过新的 timestamped migration 修正，并同步数据库测试、回滚说明和生成类型；
- Joshua 不承担功能实现或补写其他成员最低测试；未经用户明确授权，不执行 GitHub 写入、建分支、提交、push、PR 或合并。

## 4. 五个独立工作包

| 成员 | 独立工作包 | 主要文件所有权 | 固定输入合同 | 输出合同 | 个人验证 |
|---|---|---|---|---|---|
| Li | WP-A #15 任务基础 CRUD 与状态约束 | `src/features/tasks/core/`、`src/features/tasks/editor/`、`src/app/(dashboard)/tasks/` 中基础 list／new／detail／edit 路由（排除来源导航插槽）、#15 专属测试；必要的新 #15 migration 与生成类型 | Week 2 `tasks` schema／RLS、认证服务、`profiles` 单一负责人 | `TaskEditorPort`、`TaskRecordDTO`、稳定错误语义、任务基础页面与持久化 | T-01、T-02、T-08；刷新、未知状态、route／server／RLS allow-deny |
| Xuanwei | WP-B #23 来源保留与转换入口 | `src/features/tasks/conversion/source/`、`src/features/meetings/agenda/TaskConversionEntry.tsx`、转换入口路由及 #23 专属测试；必要的新 #23 migration | Li 的 task port／DTO；Sprint 3 meeting／agenda DTO；Shiying 的冻结校验接口 mock | `TaskSourceContext`、`TaskConversionPort`、决策／讨论点入口、原子来源持久化 | C-01、C-02、C-05、C-07；重复提交至多一条、外键和权限 |
| Shiying | WP-C #24 转换字段校验与单一负责人 | `src/features/tasks/conversion/validation/`、转换表单字段组件及 #24 专属单元／集成／数据库测试 | `TaskSourceContext`；Li 的允许状态和 assignee DTO；Xuanwei 的 conversion port mock | `ConvertedTaskDraft`、`TaskConversionValidationResult`、单选负责人控件、失败保持来源 | C-02、C-03、C-06；缺失字段、双负责人、无部分写入、错误摘要 |
| Yubo | WP-D #25 双向来源导航 | `src/features/tasks/source-navigation/`、任务详情来源插槽、会议详情关联任务插槽及 #25 专属测试 | `TaskRecordDTO`；`TaskSourceContext`；冻结的 meeting／task URL 和只读查询接口 | `SourceTraceabilityPanel`、`RelatedTasksPanel`、安全缺失／拒绝状态及双向链接 | C-04、C-07；决策／讨论点标签、缺失源、无权访问、描述性链接 |
| Joshua | WP-E #3 集成、验收与阶段评审 | `tests/acceptance/decision-to-task/`、`tests/fixtures/decision-to-task/`、`docs/plans/week-4/US_02_ACCEPTANCE_RECORD.md`、阶段评审记录、Sprint 集成记录和总 PR 描述 | 前四个功能 PR 已进入 `Testing`；C-01–C-07 公开 adapter；Project Sprint 成员 | 可失败的跨包 harness、虚构 fixture、集成／权限证据、Stakeholder 评审材料、总 PR 与交接 | C-01–C-07、T-01／T-02／T-08 回归、完整质量命令、Project／PR／review 核对 |

### PR 路线与集成顺序

| 工作包 | Issue 分支 | PR base | 进入 Sprint 分支的条件 | 集成顺序 |
|---|---|---|---|---|
| WP-A / #15 | `feature/15-task-core-crud` | `sprint/4-decision-to-task` | T-01／02／08、migration／RLS 影响、功能测试、非作者 review 和 checks 通过 | 1 |
| WP-B / #23 | `feature/23-decision-task-source` | `sprint/4-decision-to-task` | C-01／02／05／07、单次创建、来源外键、权限和非作者 review 通过 | 2 |
| WP-C / #24 | `feature/24-conversion-validation` | `sprint/4-decision-to-task` | C-02／03／06、无部分写入、单一负责人和非作者 review 通过 | 3 |
| WP-D / #25 | `feature/25-source-navigation` | `sprint/4-decision-to-task` | C-04／07、缺失／拒绝状态、描述性链接和非作者 review 通过 | 4 |
| WP-E / #3 | 不另开成员功能 PR；Joshua 在 Sprint 分支建立共享验收并完成总体验收 | `main`（Sprint 总 PR） | 前四项均为 `Testing`，C-01–C-07、完整回归和阶段评审材料通过，Project 成员精确匹配 | 5 |

独立执行规则：

1. 每名成员只修改其文件所有权范围；两个来源导航插槽由 Yubo 独占，基础路由所有者只提供冻结挂载点；
2. #23 在 #15 未集成时使用 `TaskEditorPort` mock；#24、#25 在 #23 未集成时使用 `TaskSourceContext` 和 conversion adapter fixture；
3. 功能所有者负责各自 Issue 的最低单元、集成、路由、数据库与权限测试；Joshua 只负责跨包 harness、fixture 和 Sprint 级证据；
4. 合同变化必须记录影响场景、提供者、消费者和复验范围，由合同提供者实施，消费者不得跨边界修补；
5. 成员 PR 只关联一个主要 Issue并以 Sprint 分支为 base；合并后 Issue 保持 `Testing`；
6. Joshua 不在前四个功能包进入 `Testing` 前开始 #3 的集成与验收，也不以收尾为由重写功能代码；
7. 只有 Sprint 总 PR 经独立审查、checks、Stakeholder 阶段评审记录和明确合并授权后进入 `main`，整组 Issues 才能判断是否 `Done`。

## 5. 固定接口与文件边界

| 合同／边界 | 提供者 | 使用者 | 冻结内容 | 允许变更条件 |
|---|---|---|---|---|
| `TaskEditorPort`／`TaskRecordDTO` | Li | Xuanwei、Shiying、Yubo、Joshua | create／get／update；`id`、title、description、单一 `assigneeId`、`dueDate`、三种 persisted status、可选 source／event IDs；稳定 discriminated result | T-01／T-02 无法表达或现有 schema 与权威文档冲突 |
| `TaskSourceContext`／`TaskConversionPort` | Xuanwei | Shiying、Yubo、Joshua | source meeting 必填；decision 与 discussion point 至多一个；创建至多一条任务；失败不丢来源、不产生部分记录 | C-01／02／05 或数据库来源约束无法验收 |
| 转换校验合同 | Shiying | Xuanwei、Joshua | title、description、单一 assignee、due date、允许状态必填／受约束；字段错误稳定；不得选择两个负责人 | C-03／C-06 或服务端与数据库约束不一致 |
| 双向导航插槽 | Yubo | Li、Xuanwei、Joshua | 会议详情的关联任务列表；任务详情的来源会议及 decision／discussion 标签；missing／denied 不泄露资源存在性 | C-04／C-07 无法通过或 URL namespace 冲突 |
| C-01–C-07 adapter／fixture | Joshua | Sprint 总验收与阶段评审 | 每个场景有虚构前置数据、执行入口、预期结果和“缺失集成即失败”；不复制功能内部逻辑 | harness 不能区分未接入、权限拒绝与真实通过 |

冲突规则：文件所有者保留本周编辑权。需要跨边界修改时，提出者只记录所需变更和理由，由所有者实施或明确交接；涉及 schema／RLS 时同时记录 migration、回滚和生成类型影响。

## 6. 三个团队检查点

### 检查点 1：周初合同冻结

- Joshua 手动确认 #3、#15、#23、#24、#25 的 Sprint、assignee、依赖、状态和 Acceptance Gate；
- 确认 Sprint 3 已形成可用的会议／议程输入，Sprint 4 分支基线、五个工作包和文件所有权无冲突；
- 冻结第 5 节合同、两个路由挂载点、错误语义与虚构 fixture shape；
- 确认四名功能开发者可用 mock／adapter 独立开始，Joshua 只做只读准备。

### 检查点 2：单次集成

- 按 #15 → #23 → #24 → #25 的顺序合并成员 PR；
- 每个 PR 只关联一个主要 Issue，base 必须是 `sprint/4-decision-to-task`；
- 只处理冻结合同不一致、当前 PR 回归、安全或数据完整性阻断，不在集成时重写他人工作；
- 每个成员 PR 完成一次非作者 review 和 checks，合并后对应 Issue 保持 `Testing`。

### 检查点 3：Joshua Sprint 收尾与阶段评审

- 前四个功能工作包均进入 `Testing` 后，Joshua 才开始 #3 和共享验收；
- 核对 Project 中 `Sprint 4` Issue 完整集合与总 PR 声明完全一致；
- 运行 C-01–C-07、T-01／T-02／T-08 回归、lint、typecheck、应用测试、数据库测试和 build；
- 复核 route／server／RLS 拒绝、来源外键、单一负责人、重复提交、migration 顺序／回滚和虚构数据；
- 在内部门禁通过后演示“会议 → 决策转任务”流程，记录 Stakeholder 对核心工作方式的确认、P0 澄清和 Post-MVP 建议；
- 创建以 #3 为主要 Issue 的 Sprint 总 PR；取得非作者 review 和全部 checks 后，合并仍需用户另行明确授权。

## 7. 本周交付物

- #15 任务基础 CRUD、状态约束、任务页面和三层权限测试；
- #23 决策／讨论点转换入口、来源上下文、原子来源持久化和重复提交防护；
- #24 转换字段校验、单一负责人、失败保持来源和相应测试；
- #25 会议与任务双向导航、安全缺失／拒绝状态和可访问链接；
- Joshua 的 `C-01` 至 `C-07` harness、虚构 fixture、[US-02 验收记录](US_02_ACCEPTANCE_RECORD.md)、[Sprint 4 遗留修复记录](SPRINT_4_REMEDIATION_RECORD.md)、Stakeholder 阶段评审记录、Sprint 总 PR 证据和开发第 5 周 Ready 输入。

## 8. 本周验收清单

- [ ] Joshua 已手动核对五项 Sprint 成员及 Project 字段，且每人只有一个主要 Issue 处于 `In Progress`；
- [ ] 四个功能工作包分别完成个人验收且无文件所有权冲突；
- [ ] T-01、T-02、T-08 与 C-01 至 C-07 全部通过；
- [ ] 从 decision 和 discussion point 创建任务均只产生一条记录并保留正确来源；
- [ ] title、description、单一负责人、due date 和允许状态在 UI、服务端及数据库适用层一致；
- [ ] meeting 与 task 双向导航、missing source、permission denied 和不泄露反馈均通过；
- [ ] loading、empty、success、validation error、permission denied、duplicate submission 和 system error 按适用范围覆盖；
- [ ] 任何增量 migration 均可重放、有回滚说明，RLS／约束测试和生成类型已同步；
- [ ] 功能自身测试与 Joshua 的共享验收责任未混淆；
- [ ] 每个成员 PR 完成非作者审查并合并到 Sprint 分支，Issues 保持 `Testing`；
- [ ] Joshua 最后执行 Sprint 收尾，未提前开始第二个主要工作或接管功能实现；
- [ ] Stakeholder 阶段评审使用通过内部门禁的集成版本，反馈被分类为 P0 澄清或 Post-MVP；
- [ ] Sprint 总 PR 的主要 Issue、纳入 Issues、base/head 与 Project Sprint 成员一致；
- [ ] lint、typecheck、应用测试、数据库测试和 build 通过；
- [ ] 测试、日志、截图、演示和文档无密钥或真实参与者数据；
- [ ] 阻断缺陷为零，开发第 5 周 #16、#20–#22 的输入达到 Ready。

## 9. 风险与应对

| 风险 | 信号 | 影响 | 应对 | 所有者 |
|---|---|---|---|---|
| Sprint 3 未完成或会议合同漂移 | #12／#13 未在 `main` 或输出合同与 Week 3 文档不一致 | #23、#25 无稳定来源 | Sprint 4 保持未开始；先完成 Sprint 3 验收或由原所有者修正合同 | Joshua |
| #15 成为所有转换工作的关键阻断 | task port／DTO、状态或路由反复变化 | #23–#25 返工 | 周初冻结最小 port／DTO；消费者使用 mock；只在单次集成接真实实现 | Li |
| #23 与 #24 职责重叠 | 同一 PR 同时修改 source orchestration 与 validation 目录 | 文件冲突、错误归属不清 | Xuanwei 只拥有来源和 orchestration；Shiying 只拥有转换字段与校验；合同变化回到提供者 | Xuanwei／Shiying |
| #25 需要修改基础路由 | Yubo 与 Li／Xuanwei 同时编辑 task／meeting 页面 | 合并冲突或越界修改 | 周初冻结两个 route-local 插槽；Yubo 只拥有插槽组件，基础路由所有者提供挂载点 | Yubo |
| 权限只在 UI 生效 | 直接 Server Action／数据库查询可创建或读取任务 | C-07／T-08 与安全门禁失败 | 各功能包覆盖 route／server／RLS；Joshua 最后复跑三层拒绝 | Li／Xuanwei／Joshua |
| Stakeholder 反馈被当场扩展为功能 | 评审中出现新字段、通知、多负责人等建议 | Sprint 失焦、P0 延误 | 只记录并分类；P0 澄清需正式决定，新能力进入 Post-MVP | Joshua |
| Joshua 过早介入功能实现 | #3 与任一功能 Issue 同时由 Joshua 开始，或收尾 diff 修改功能目录 | WIP 超限、所有权混乱 | 前四项 `Testing` 前只做只读准备；缺陷退回对应功能所有者 | Joshua |

## 10. 本周完成定义

1. #15、#23、#24、#25 均通过个人验收、非作者 review 并进入 `Testing`；
2. Joshua 最后完成 #3 的 C-01 至 C-07 跨包验收、T-01／T-02／T-08 回归和 `US_02_ACCEPTANCE_RECORD.md`；
3. “会议 → 决策／讨论点 → 任务 → 来源会议”流程的成功、失败、重复、缺失与权限路径均可复验；
4. lint、typecheck、应用测试、数据库测试和 build 全部通过；
5. migration、RLS、来源约束、单一负责人、生成类型、虚构数据和回滚影响已核对；
6. Stakeholder 阶段评审完成并只形成已确认的 P0 澄清或 Post-MVP 记录；
7. Sprint 总 PR 内容与 GitHub Project `Sprint 4` 成员完全一致，阻断问题为零；
8. 只有经明确授权把 Sprint 总 PR 合并到 `main` 后，整组 Issues 才能进入 `Done`。

## 11. 未完成项处理

- Sprint 3 基线、Project 字段或真实 Issue 依赖不满足时，保持相关 Issue 未开始并记录阻塞原因、影响、已尝试操作、所需帮助、负责人、开始时间和下次检查时间；
- 合同阻断由提供者处理，消费者不得跨文件所有权修补；超过一个工作日按协作规则升级；
- C-01 至 C-07、T-01／T-02／T-08、权限、数据一致性或全局构建失败会阻止 Stakeholder 演示和 Sprint 总 PR；
- Stakeholder 新需求默认进入 Post-MVP，不在评审后直接插入 Sprint 4；
- 非阻断体验建议进入 backlog，不顺手并入功能 PR；
- 未经验证的结果不得描述为完成，未进入 `main` 的整组 Issues 不得标记 `Done`。
