# Yubo：课程第 4 周（开发第 3 周）会议编辑 UI 工作计划

所属统一周计划：[会议记录流程与 Sprint 3 收尾](WEEK_3_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Li 的会议领域服务](LI_WEEKLY_WORK_PLAN.md)和[Xuanwei 的 agenda 输出](XUANWEI_WEEKLY_WORK_PLAN.md)；独立开发阶段分别使用冻结的 `MeetingEditorPort` 与 `MeetingAgendaSection` mock。

### Sprint 交付路线

- GitHub Sprint：`Sprint 3`；
- Sprint 集成分支：`sprint/3-meeting-management`；
- 本工作包 Issue 分支：`feature/56-meeting-editor-ui`；
- 成员 PR base：`sprint/3-meeting-management`；
- Sprint 总 PR 主要 Issue：#2；
- 唯一交接对象：Joshua。

## 1. 独立目标

独立交付会议创建、详情和更新 UI：将 Li 的领域服务和 Xuanwei 的 agenda 组件组合为可实际操作的会议编辑流程，覆盖 loading、validation、success、permission denied 和 system error，并完成 M-01、M-02、M-05 的页面／路由责任。Yubo 不承担共享 Sprint 验收；共享 harness、fixture 和证据由 Joshua 在最后收尾阶段负责。

## 2. 工作包与文件所有权

- 成员姓名：Yubo；GitHub assignee：`Caiqwe123`；
- 独立工作包：WP-C 会议创建与更新 UI；
- 主要 Issue：#56 `[P0][MEET-01-02] Build meeting create and update UI states`，父项 #2，effort 5；
- 允许修改：`src/features/meetings/editor/`、`src/app/(dashboard)/meetings/new/`、`src/app/(dashboard)/meetings/[meetingId]/` 及其相邻 loading／error 文件、路由旁组件测试、Yubo 功能 Issue 专属路由／集成测试；
- 禁止修改：Li 的 `src/features/meetings/core/`／`schemas.ts`／migration，Xuanwei 的 `agenda/`，Shiying 的 `history/`／会议列表路由，Joshua 的 `tests/acceptance/meetings/`、`tests/fixtures/meetings/` 和验收记录；
- 固定输入合同：Li 的 `MeetingEditorPort`／`MeetingRecordDTO`／稳定错误结果，Xuanwei 的 `MeetingAgendaSection`，Sprint 2 的共享 form／feedback／layout 组件；
- 输出合同：新建／详情／更新页面、`MeetingEditor` 组合壳、字段级错误映射、提交状态反馈和描述性导航；
- 功能自身测试：M-01、M-02、M-05 的页面／路由路径，loading、validation、success、permission denied、system error、重复提交、键盘和窄屏；
- 共享验收平台边界：Joshua 拥有跨工作包 harness、共享 fixture 和 Sprint 级证据；Yubo 只提供公开页面与测试入口。

## 3. 开始条件

- 已创建唯一主要功能 Issue，写明用户价值、验收、文件所有权、assignee、effort、依赖与 `Sprint 3`；
- #12 已正式收窄为 Li 的 core／server／persistence 工作，不再包含 Yubo 的 editor／route 文件；
- `MeetingEditorPort`、`MeetingRecordDTO`、错误结果和 `MeetingAgendaSection` 已冻结；
- 已读取当前 Next.js 本地文档中 Server／Client Components、forms／Server Actions、dynamic routes、loading／error 主题；
- Sprint 2 的共享布局、表单和反馈组件可用；
- 所有 UI fixture、截图和演示只使用虚构会议与账号。

## 4. 独立执行步骤

### 步骤 1：建立编辑器 UI 合同

执行：

1. 将 `MeetingEditorPort` 的成功和失败结果映射为 UI 状态；
2. 定义新建、加载详情、更新、取消／返回和 agenda 插槽行为；
3. 冻结字段标签、帮助文本、错误摘要、focus 行为和提交禁用规则；
4. 使用 mock 验证没有 Li／Xuanwei 实现时仍可独立开发和测试。

产出：`MeetingEditor` 状态模型和 UI 组合合同。

检查：每个可观察状态都有明确输入、页面反馈和下一步操作。

### 步骤 2：完成会议创建与更新 UI

执行：

1. 实现 `/meetings/new` 的会议基础字段、参会人和 agenda 组合；
2. 实现 `/meetings/[meetingId]` 的 loading、详情展示和更新流程；
3. 使用 Li 的 port 完成提交，不在 Client Component 导入 server-only 模块或数据库整行类型；
4. 接入 Xuanwei 的 `MeetingAgendaSection`，不复制其排序或原子保存逻辑；
5. 实现 validation、success、permission denied、not found 和 system error 的安全反馈。

产出：可使用 mock 完整操作的新建／详情／更新 UI。

检查：页面只做组合与交互，领域验证和数据库 I/O 保留在 Li 的服务端边界。

### 步骤 3：个人测试与边界验证

执行：

1. 覆盖 M-01 的创建、刷新后详情显示和更新反馈；
2. 覆盖 M-02 的字段级错误、错误摘要、focus 和无误导成功提示；
3. 覆盖 M-05 的匿名／参与者直接 URL 和页面数据拒绝；服务端／RLS 证据由 Li 提供并在 Joshua 集成验收中组合；
4. 覆盖重复提交、详情不存在、加载失败和更新失败；
5. 执行键盘顺序、窄屏、状态非纯色表达检查；
6. 运行 lint、typecheck、Yubo 功能测试和 build。

产出：M-01、M-02、M-05 的 UI／路由验证证据。

检查：成功、失败和权限状态可区分，客户端 bundle／日志无 secret 或敏感记录。

### 步骤 4：成员 PR 与一次性交接

执行：

1. 创建只关联 #56、base 为 Sprint 分支的成员 PR；
2. 先使用 mock 完成自查，再在 #12、#13 合入后接真实 port／component；
3. 需要修改 core 或 agenda 时提交变更请求，不越权修改；
4. 完成非作者 review 和必要 checks；
5. 合并后保持主要 Issue 为 `Testing`；
6. 向 Joshua 交付页面入口、状态矩阵、测试命令、截图和剩余风险。

产出：会议编辑 UI 成员 PR 与一次性交接包。

检查：Joshua 可仅依赖页面入口和公开命令复验 UI 路径。

## 5. 低频沟通规则

- 周初冻结一次 port、agenda 插槽和状态合同；
- Li／Xuanwei 未集成时使用 mock，不持续等待；
- 只有合同无法表达 UI、路由权限失效或出现 server-only 泄露时临时沟通；
- 不修改 Li、Xuanwei、Shiying 或 Joshua 文件；
- 完成后只向 Joshua 交接一次。

## 6. 个人交付物

- `MeetingEditor` 状态模型和组合壳；
- `/meetings/new` 与 `/meetings/[meetingId]` 页面；
- loading、validation、success、permission denied、not found、system error 与重复提交反馈；
- M-01、M-02、M-05 的 UI／路由测试；
- 键盘、窄屏和虚构数据截图证据；
- #56、成员 PR 与 Sprint 集成证据。

## 7. 个人验收清单

- [x] #56 已创建、分配给 Yubo 并写回计划；
- [ ] #12 与本工作包的文件所有权无重叠；
- [ ] 新建、详情和更新 UI 可操作；
- [ ] M-01、M-02、M-05 的页面／路由责任通过；
- [ ] loading、validation、success、permission denied、not found、system error 和重复提交均有清楚反馈；
- [ ] 没有把领域验证、Supabase I/O 或 agenda 内部逻辑复制进 UI；
- [ ] Client Component 未导入 server-only 模块或完整数据库记录类型；
- [ ] lint、typecheck、功能测试和 build 通过；
- [ ] PR 的 Sprint、base/head、Issue 和文件范围正确；
- [ ] 合并后主要 Issue 保持 `Testing`；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| #56 Project 字段后续漂移 | 真实开发状态与看板不一致 | Sprint／Status／assignee 与分支或 PR 不符 | 由 Joshua 按手动维护规则恢复为真实状态 | Joshua | 发现后立即 |
| #12／#56 边界被后续改写 | Li／Yubo 文件冲突 | Issue 或计划重新出现范围重叠 | 保持 #12 为 core／server、#56 为 editor／routes | Li／Yubo | 立即 |
| port／agenda 合同变化 | UI 集成返工 | mock 与真实输出无法映射 | 提交最小变更请求，由合同提供者修正 | Yubo／提供者 | 单次集成内 |
| Client Component 泄露服务端能力 | 安全与构建阻断 | bundle 出现 server-only import 或敏感类型 | 立即停止集成，移回服务端边界并加回归测试 | Yubo | 立即 |

## 9. 未完成项处理

- #56 Project 字段若后续与真实分支或 PR 不一致，先由 Joshua 手动修正再继续；
- M-01／M-02／M-05 页面责任、权限或 server-only 边界失败会阻止交接；
- core／agenda 缺陷退回 Li 或 Xuanwei，不越界修复；
- 非阻断视觉改进进入 backlog；
- 新需求不扩大本工作包。

## 10. 周末交接

- 已完成：会议编辑 UI、状态反馈、功能测试和可访问性证据；
- 未完成：按真实结果记录原因、责任 Issue、负责人和期限；
- 输出合同：页面入口、`MeetingEditor`、状态矩阵和测试命令；
- 集成注意事项：先合入 #12 和 #13，再接真实 port／agenda；
- Sprint 总 PR 证据：#56、checks、review、M-01／02／05 UI 摘要和虚构截图；
- 下周建议：在 #23–#25 中复用已冻结的页面组合边界，不把任务功能加入本周 editor。
