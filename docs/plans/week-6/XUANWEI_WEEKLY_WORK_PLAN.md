# Xuanwei Xu：课程第 7 周（开发第 6 周）独立工作计划

所属统一周计划：[活动与报名](WEEK_6_IMPLEMENTATION_PLAN.md)

直接依赖文档：[活动基础 port](LI_WEEKLY_WORK_PLAN.md)

> 本文按[成员模板](../../templates/MEMBER_WEEKLY_WORK_PLAN_TEMPLATE.md)编制，是待实施计划。下列步骤与验收不得预先勾选为完成。

### Sprint 交付路线

- 计划 Sprint：`Sprint 6`；集成分支：`sprint/6-events-registration`。
- 主要 Issue：#18 → #19（顺序）；首个 Issue 分支：`codex/18-event-preparation`。
- 所有成员 PR base：`sprint/6-events-registration`；一份 PR 只关联一个主要 Issue。
- Sprint 总 PR 主要 Issue：#5；分支 → main 的最终合并须另获授权。
- GitHub 账号：`YUHAN2233`；唯一交接对象：Joshua，按 #18 与 #19 两个独立验收包在工作包结束时汇总交接。
- Sprint 6 字段与分支尚未在本次任务创建；启动前由 Joshua 核对实时 Project 和最新 main。

## 1. 独立目标

先交付筹备任务关联与简单进度，再交付真实近期活动查询和 Dashboard 接入，完成跨周 T-05/T-06。

## 2. 工作包与文件所有权

- 允许修改：`src/features/events/preparation/`、`upcoming/`；交接后的 `src/features/dashboard/upcoming-events/`、`src/features/tasks/event-link/`、活动筛选选项 adapter 和任务编辑器限定活动字段挂载。
- 禁止修改：其他三位功能成员目录、Joshua 的共享验收/CI/fixture、历史 migration、无关 UI 或权限范围。共享文件例外严格执行统一计划中的单一所有者交接。
- 固定输入：Li 的 Event DTO、已有 TaskRecordDTO 及 Sprint 5 filter/date/Upcoming port；真实 provider 未就绪时用虚构 fixture。
- 输出合同：#18 的 task-event 关联/解除、进度及 T-05 真实活动筛选；#19 的共享 upcoming query、真实 Dashboard adapter、E-06 和完整 T-06。
- 功能自身测试：preparation/upcoming 局部测试、`tests/integration/events/preparation/`、`tests/integration/events/upcoming/`；各 Issue 单独证据与 PR，不合成一个主要 Issue。
- 共享平台边界：Joshua 负责跨工作包 harness、共享 fixture、质量配置及 Sprint 级证据；不代替本 Issue 的最低功能测试。

## 3. 开始条件

1. 阅读本 Issue 全文、评论、标签、依赖、验收和 Project 字段，确认当前只启动一个主要 Issue。
2. 最新 Sprint 基线及自己文件范围已核对，无他人未提交重叠修改；创建分支或 GitHub 写操作须有对应授权。
3. 统一周计划合同冻结；provider 暂缺时有虚构 fixture/类型可独立开发，不将 mock 通过声称为真实集成通过。
4. Next.js 编码前读当前安装文档，涉及库/API 先按 Context7 规则查询；权限/数据库改动按仓库权威文档执行。
5. 前周基线已验收合入 main；本周 participants/registrations/events 现有表已经核对，避免重建或扩大权限。

## 4. 独立执行步骤

### 步骤 1：建立并记录基线

执行：先在 #18 冻结单一 eventId 更新与 Progress DTO；核对 Week 5 文件所有者交接，复用既有查询，任务更新必须保留来源会议/决策/讨论点及其他字段。

产出：当前 SHA、输入输出合同、局部 fixture、文件清单与验收对应表，写入自己的 PR 交接说明。

检查：每个输入有可信来源或明确 mock；没有未归属共享文件；本 Issue 之外不新增能力。

### 步骤 2：完成核心实现

执行：实现关联任务和完成数/总数，验证 2/3、0/0；由 Li 挂载活动详情插槽；完成 #18 自测、review 并进入 Testing 后才创建 `codex/19-upcoming-events` 开始第二个主要 Issue。

产出：#18 的 task-event 关联/解除、进度及 T-05 真实活动筛选；#19 的共享 upcoming query、真实 Dashboard adapter、E-06 和完整 T-06。

检查：核心行为与 Issue 验收逐条对应；UI 按适用范围覆盖 loading、empty、success、validation error、permission denied、duplicate submission 和 system error；错误不吞噬、不泄露。

### 步骤 3：接入与个人测试

执行：在 #19 实现 startsAt >= now 的真实查询，按 startsAt/id 稳定排序，复用 Sydney 展示；替换活动占位 adapter；验证真实创建活动、任务关联、筛选和 Dashboard 计数/条目，错误与空集分开。

验证：#18：E-04/E-05、T-05、关联唯一性/外键/授权、来源字段保留；#19：E-06/E-07、完整 T-06、固定时钟当前/过去/未来、排序、empty/error、无敏感字段。

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
| 同时启动两个主要 Issue，或重写 Sprint 5 Dashboard/筛选器 | 功能验收或冻结合同不满足时立即沟通 | #18 进入 Testing 后再启动 #19；仅替换已交接 adapter 和对应组件，调用既有公共查询 | Xuanwei Xu | 成员 PR 进入 Review 前；阻断首次记录后下一工作日同一时间复查 |
| 上游真实 adapter 未交付 | mock 通过但无法完成最终集成 | 用 fixture 完成本地交付，向 Joshua 记录缺失 provider 与负责 Issue；不假称真实通过 | Xuanwei Xu | 单次集成前；超过一个工作日升级 |

## 9. 未完成项处理

立即记录原因、影响、已尝试操作、所需帮助、本人姓名、首次发现时间和下次检查时间；超过一个工作日升级 Joshua。普通非阻断建议进入 backlog；权限、数据丢失、密钥和 P0 阻断必须先解决。不得改他人文件绕开问题，不因计划已写好就将任务提前标为完成。

## 10. 周末交接

- 已完成：当前仅完成计划编制；执行后填入功能和测试的真实结果。
- 未完成：本计划列出的功能开发、验证、非作者 review 和 Sprint 集成均待执行，由 Xuanwei Xu 在本开发周负责；阻断按第 9 节记录。
- 输出合同：#18 的 task-event 关联/解除、进度及 T-05 真实活动筛选；#19 的共享 upcoming query、真实 Dashboard adapter、E-06 和完整 T-06。
- 集成注意事项：只修改明确所有权；消费者从 mock 换到真实 provider 后必须复验；不得手改生成数据库类型。
- Sprint 总 PR 证据：向 Joshua 提供每项 Issue/场景/命令/SHA/review/checks/风险，缺失则标未完成。
- 下周交接：交付稳定活动/任务/近期活动关系给现场签到周；保留两个 Issue 的独立验证记录。
