# Yubo Cai：课程第 6 周（开发第 5 周）独立工作计划

所属统一周计划：[Dashboard 与任务跟进](WEEK_5_IMPLEMENTATION_PLAN.md)

直接依赖文档：[风险分类](SHIYING_WEEKLY_WORK_PLAN.md)、[任务列表宿主](LI_WEEKLY_WORK_PLAN.md)、[Dashboard 宿主](XUANWEI_WEEKLY_WORK_PLAN.md)

> 本文按[成员模板](../../templates/MEMBER_WEEKLY_WORK_PLAN_TEMPLATE.md)编制，是待实施计划。下列步骤与验收不得预先勾选为完成。

### Sprint 交付路线

- 计划 Sprint：`Sprint 5`；集成分支：`sprint/5-dashboard-follow-up`。
- 主要 Issue：#22；首个 Issue 分支：`codex/22-due-risk-reminders`。
- 所有成员 PR base：`sprint/5-dashboard-follow-up`；一份 PR 只关联一个主要 Issue。
- Sprint 总 PR 主要 Issue：#4；分支 → main 的最终合并须另获授权。
- GitHub 账号：`Caiqwe123`；唯一交接对象：Joshua。
- 按统一计划上表手动分配 Sprint 5，启动前复查实际状态和 WIP，不因分配而自动标记开始。

## 1. 独立目标

让任务与 Dashboard 的临期／逾期提醒有文字、图标和可访问含义，窄屏可用且不引入外部通知。

## 2. 工作包与文件所有权

- 允许修改：`src/features/tasks/reminders/` 与提醒组件/可访问性局部测试。
- 禁止修改：其他三位功能成员目录、Joshua 的共享验收/CI/fixture、历史 migration、无关 UI 或权限范围。共享文件例外严格执行统一计划中的单一所有者交接。
- 固定输入：Shiying 的 DueRisk 结果、任务标题/链接与宿主展示上下文；用 fixture 独立开发，#21 是最终宿主验证依赖。
- 输出合同：DueRiskReminder 及两种宿主使用示例；文字+图标区分 overdue/dueSoon；正常、完成、异常状态处理和窄屏证据。
- 功能自身测试：提醒局部组件测试和 `tests/integration/task-follow-up/reminders/`；真实页面窄屏检查说明、虚构数据截图归本人交付。
- 共享平台边界：Joshua 负责跨工作包 harness、共享 fixture、质量配置及 Sprint 级证据；不代替本 Issue 的最低功能测试。

## 3. 开始条件

1. 阅读本 Issue 全文、评论、标签、依赖、验收和 Project 字段，确认当前只启动一个主要 Issue。
2. 最新 Sprint 基线及自己文件范围已核对，无他人未提交重叠修改；创建分支或 GitHub 写操作须有对应授权。
3. 统一周计划合同冻结；provider 暂缺时有虚构 fixture/类型可独立开发，不将 mock 通过声称为真实集成通过。
4. Next.js 编码前读当前安装文档，涉及库/API 先按 Context7 规则查询；权限/数据库改动按仓库权威文档执行。
5. 已阅读分阶段 T-05-S5/T-06-S5 决定；不把活动管理功能提前纳入自己的 Issue。

## 4. 独立执行步骤

### 步骤 1：建立并记录基线

执行：核对 #22 和 T-07，冻结组件 props；不让组件自行取时钟或读数据库，分别准备 overdue/dueSoon/normal/completed/invalid fixture。

产出：当前 SHA、输入输出合同、局部 fixture、文件清单与验收对应表，写入自己的 PR 交接说明。

检查：每个输入有可信来源或明确 mock；没有未归属共享文件；本 Issue 之外不新增能力。

### 步骤 2：完成核心实现

执行：实现文本、图标及可访问标签，避免仅颜色表达；验证长标题、键盘焦点、缩放和窄屏；不要新增 email/SMS/push SDK、定时任务或偏好设置。

产出：DueRiskReminder 及两种宿主使用示例；文字+图标区分 overdue/dueSoon；正常、完成、异常状态处理和窄屏证据。

检查：核心行为与 Issue 验收逐条对应；UI 按适用范围覆盖 loading、empty、success、validation error、permission denied、duplicate submission 和 system error；错误不吞噬、不泄露。

### 步骤 3：接入与个人测试

执行：向 Li/Xuanwei 提供稳定组件入口，由两位宿主所有者挂载；自己复验两处实际渲染和网络行为，发现挂载问题退回宿主所有者，不直接修改其 page。

验证：T-07：两处真实临期/逾期提醒；组件状态矩阵、文字可辨/屏幕阅读标签、键盘、窄屏、长文本；检查配置与网络无外部通知；完成状态不继续告警。

执行当前仓库已有的 `npm run lint`、`npm run typecheck`、`npm test`、`npm run build`，记录自己新增功能测试的实际结果。涉及 schema/RLS 时增加数据库约束、角色、并发、迁移重放/顺序/回滚和生成类型核对；不适用时说明理由，不把未运行写成通过。重置只在明确可重建的虚构本地测试库执行。

产出：对应场景、真实命令、结果、测试 SHA 与适用的虚构数据渲染证据。

检查：失败/边界/权限与成功路径同样有证据；未知结果保留未验证状态；不只做类型测试或全 mock 测试。

### 步骤 4：成员 PR 与一次性交接

1. 复核 diff/所有权，按已有授权暂存、提交、推送及创建指向 Sprint 的成员 PR；正文英文并包含本主要 Issue、需求/场景、实际验证、权限/隐私/迁移/UI/风险/回退。
2. 提交自测齐全的交付物后集中进行一次非作者 review；功能 PR 的计划审查人为 Joshua，实际批准不能以作者或 Codex 自查替代。
3. 按缺陷归属修复本 Issue 输出或直接回归；他人输出缺陷交还所有者，接口争议由 Joshua 组织冻结合同修订。
4. 必需 checks/review 通过且获合并授权后，成员 PR 合到 Sprint 分支，Issue 保持 Testing；总 PR 合入 main 后再判断 Done。
5. 向唯一交接对象交付 Issue/PR/SHA、公共入口、实际测试、风险和未完成项；顺序两个 Issue 时分别保存验收，不并成双主要 Issue PR。

产出：可直接集成的成员交接包。检查：接收者能够按说明运行和复验，不需要接管自己的业务实现。

## 5. 低频沟通规则

周初一次确认合同，工作包完成后一次性交接，周末集中验收；不安排每日全员同步、不持续结对。只有接口不能满足、安全问题或阻断才临时沟通；跨文件请求由所有者修改或明确交接。功能缺陷本人负责，Joshua 负责判断跨包影响与集成门禁。

## 6. 个人交付物

- 上述公共合同、功能代码、局部测试和使用说明。
- 带真实运行结果的个人验证记录及必要虚构数据截图。
- 成员 PR、非作者 review/checks 及 Sprint 集成证据。
- 风险、未完成项和下一周交接说明。

## 7. 个人验收清单

- [ ] 独立目标与对应 Issue 验收通过。
- [ ] 修改范围没有越过所有权。
- [ ] 输出符合冻结合同且依赖已按真实实现复验。
- [ ] 成功、失败、边界、权限及适用 UI 状态已覆盖。
- [ ] 功能自身测试完整，未转交 Joshua 代写。
- [ ] 虚构数据、隐私和密钥要求通过。
- [ ] 适用 lint、typecheck、test、build 及数据库检查有真实结果。
- [ ] 非作者 review、checks 与 PR base/head/主要 Issue 正确。
- [ ] 成员 PR 合并到 Sprint 后保持 Testing，未提前关闭。
- [ ] 未完成项有本人负责人、期限及下次检查时间。

## 8. 风险与问题

| 风险 | 影响/触发条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|
| 仅颜色告警或组件未在两个宿主完整挂载 | 功能验收或冻结合同不满足时立即沟通 | 文字/图标/可访问名称三项核对；在两处真实页面复验，缺陷交由宿主所有者处理 | Yubo Cai | 成员 PR 进入 Review 前；阻断首次记录后下一工作日同一时间复查 |
| 上游真实 adapter 未交付 | mock 通过但无法完成最终集成 | 用 fixture 完成本地交付，向 Joshua 记录缺失 provider 与负责 Issue；不假称真实通过 | Yubo Cai | 单次集成前；超过一个工作日升级 |

## 9. 未完成项处理

立即记录原因、影响、已尝试操作、所需帮助、本人姓名、首次发现时间和下次检查时间；超过一个工作日升级 Joshua。普通非阻断建议进入 backlog；权限、数据丢失、密钥和 P0 阻断必须先解决。不得改他人文件绕开问题，不因计划已写好就将任务提前标为完成。

## 10. 周末交接

- 已完成：当前仅完成计划编制；执行后填入功能和测试的真实结果。
- 未完成：本计划列出的功能开发、验证、非作者 review 和 Sprint 集成均待执行，由 Yubo Cai 在本开发周负责；阻断按第 9 节记录。
- 输出合同：DueRiskReminder 及两种宿主使用示例；文字+图标区分 overdue/dueSoon；正常、完成、异常状态处理和窄屏证据。
- 集成注意事项：只修改明确所有权；消费者从 mock 换到真实 provider 后必须复验；不得手改生成数据库类型。
- Sprint 总 PR 证据：向 Joshua 提供每项 Issue/场景/命令/SHA/review/checks/风险，缺失则标未完成。
- 下周交接：Sprint 6 开发 #27 → #28 报名工作，提醒稳定合同留给宿主维护。
