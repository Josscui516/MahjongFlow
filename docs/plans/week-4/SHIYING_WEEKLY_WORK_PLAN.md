# Shiying：课程第 5 周（开发第 4 周）独立工作计划

所属统一周计划：[决策转任务与 Sprint 4 阶段评审](WEEK_4_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Li：任务基础 CRUD 与状态约束](LI_WEEKLY_WORK_PLAN.md)、[Xuanwei：来源保留与决策／讨论点转任务](XUANWEI_WEEKLY_WORK_PLAN.md)

### Sprint 交付路线

- GitHub Sprint：`Sprint 4`；
- Sprint 集成分支：`sprint/4-decision-to-task`；
- 本工作包 Issue 分支：`feature/24-conversion-validation`；
- 成员 PR base：`sprint/4-decision-to-task`；
- Sprint 总 PR 主要 Issue：#3；
- 唯一交接对象：Joshua。

## 1. 独立目标

独立交付 #24 的转换表单与校验边界：转换任务必须包含 title、description、单一 assignee、due date 和允许 status；缺少字段或企图提交两个主要负责人时安全失败，不创建部分任务且保留来源上下文供用户修正。

## 2. 工作包与文件所有权

- 成员姓名：Shiying Liao；
- 独立工作包：WP-C 转换字段校验、单一负责人和失败原子性；
- 主要 Issue：#24；
- 允许修改：`src/features/tasks/conversion/validation/`、转换表单字段组件和 #24 专属单元／集成／数据库测试；
- 禁止修改：Li 的 tasks core／editor、Xuanwei 的 source orchestration、Yubo 的 source-navigation、Joshua 的共享验收目录；
- 固定输入合同：`TaskSourceContext`、Li 的允许状态／assignee DTO、Xuanwei 的 conversion port mock；
- 输出合同：`ConvertedTaskDraft`、`TaskConversionValidationResult`、字段错误映射、单选负责人控件和失败保留来源行为；
- 功能自身测试：C-02、C-03、C-06 的表单、纯校验、服务端集成、cardinality／无部分写入测试；
- 共享验收平台边界：跨包 conversion E2E、Sprint fixture 和验收记录由 Joshua 拥有。

## 3. 开始条件

- #24、依赖 #23／#10、Sprint／assignee／文件边界已确认；
- `TaskSourceContext`、允许状态和 assignee option shape 已冻结；真实实现未集成时使用 mock；
- 单一负责人使用一个 `assigneeId`，不得引入数组、多负责人映射或新的通用权限模型；
- 已读取当前 Next.js 本地文档中 forms／Server Actions、validation 和 error handling 的适用章节；
- fixture、截图和演示只使用虚构数据。

## 4. 独立执行步骤

### 步骤 1：建立验证合同

执行：

1. 将 C-02／C-03／C-06 映射为纯校验、表单反馈、服务端拒绝和数据库 cardinality 检查；
2. 定义 `ConvertedTaskDraft`、稳定字段错误和来源上下文保留规则；
3. 为缺失 assignee、缺失 due date、未知 status、双负责人和正常提交建立 fixture。

产出：转换校验合同和失败矩阵。

检查：验证逻辑确定、可注入且不依赖 UI、路由或数据库客户端。

### 步骤 2：实现转换字段与失败行为

执行：

1. 实现 title、description、assignee、due date、status 字段及可访问错误摘要；
2. 使用单选负责人控件，并在服务端再次验证单一 `assigneeId`；
3. 将合法 draft 交给 `TaskConversionPort`，失败时保留 `TaskSourceContext` 和用户可修正字段；
4. 覆盖 validation、pending、duplicate submission、permission denied 和 system error 状态，不显示假成功。

产出：可插入 Xuanwei conversion flow 的字段组件和验证模块。

检查：缺失／非法字段不会调用持久化；数据库中最终至多一个负责人。

### 步骤 3：个人测试与边界验证

执行：

1. 验证完整有效输入的 C-02；
2. 验证缺失 assignee／due date 的 C-03 和双负责人／数组 payload 的 C-06；
3. 验证失败后来源上下文、字段值、错误摘要焦点和无部分写入；
4. 运行 #24 专属测试、lint、typecheck、适用数据库测试和 build。

产出：C-02、C-03、C-06 的个人验证证据。

检查：UI、服务端和数据库层语义一致，功能测试不依赖 Joshua 的共享 harness 才能通过。

### 步骤 4：成员 PR 与一次性交接

执行：

1. 整理 validation contract、字段组件、测试结果和风险；
2. 创建或更新只关联 #24、以 Sprint 分支为 base 的成员 PR；
3. 完成自查、非作者 review 和 checks；
4. 合并后确认 #24 保持 `Testing`；
5. 向 Joshua 一次性交付接口、PR 和 C-02／03／06 证据。

产出：#24 成员 PR 和无需重写 source orchestration 的交接包。

检查：Xuanwei 能通过公开 validation contract 接入，Joshua 能直接运行跨包验收。

## 5. 低频沟通规则

- 周初只冻结 draft、error、assignee option 和 source context；
- Xuanwei 真实 port 未集成时使用 mock，不修改其 source 目录；
- 只有合同阻断、数据库 cardinality 冲突或权限／安全问题才沟通；
- 完成后只向 Joshua 一次性交接。

## 6. 个人交付物

- conversion validation 纯函数、表单字段和单选负责人控件；
- C-02、C-03、C-06 的功能自身测试与无部分写入证据；
- 接口、风险和数据库影响说明；
- #24 PR 与 Sprint 集成证据。

## 7. 个人验收清单

- [ ] C-02、C-03、C-06 通过；
- [ ] 失败不创建任务且来源上下文保留；
- [ ] UI、服务端和数据库最终至多一个 assignee；
- [ ] 未知 status 和缺失必填字段安全拒绝；
- [ ] 只修改允许范围，输出符合冻结合同；
- [ ] lint、typecheck、专属测试和适用 build／数据库检查通过；
- [ ] PR、review、checks 和一次性交接完整；
- [ ] 合并后 #24 保持 `Testing`。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| conversion port 错误语义不稳定 | 字段错误被吞为系统错误 | 无法区分 validation 与 persistence failure | 提交合同变更请求，由 Xuanwei 调整 source port | Shiying | 集成前 |
| 单一负责人只在 UI 限制 | 构造请求可提交多个负责人 | 服务端／数据库未拒绝数组或多行关系 | 阻止 PR，补服务端与 schema/cardinality 证据 | Shiying | PR 前 |

## 9. 未完成项处理

- C-03／C-06、来源保留或无部分写入失败会阻止交接；
- 不跨目录修补 tasks core、source orchestration 或导航；
- 多负责人、协作者或自定义字段进入 Post-MVP；
- 安全、数据丢失或密钥风险立即升级。

## 10. 周末交接

- 已完成：转换字段、校验、单一负责人和失败保留来源；
- 未完成：记录原因、负责人、期限和下次检查；
- 输出合同：`ConvertedTaskDraft`、`TaskConversionValidationResult`、字段错误映射；
- 集成注意事项：Xuanwei 调用验证后才能持久化，失败不得清除 source context；
- Sprint 总 PR 证据：#24、PR、checks、review、C-02／03／06 和数据库 cardinality 摘要；
- 下周建议：复用允许状态与 assignee DTO，不将 `Overdue` 混入 persisted status。
