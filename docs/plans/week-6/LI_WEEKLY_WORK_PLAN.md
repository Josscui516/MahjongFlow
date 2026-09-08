# Li Zhang：课程第 7 周（开发第 6 周）独立工作计划

所属统一周计划：[活动与报名](WEEK_6_IMPLEMENTATION_PLAN.md)

直接依赖文档：无；依赖上周已交付数据/类型基线。

> 本文按[成员模板](../../templates/MEMBER_WEEKLY_WORK_PLAN_TEMPLATE.md)编制，是待实施计划。下列步骤与验收不得预先勾选为完成。

### Sprint 交付路线

- 计划 Sprint：`Sprint 6`；集成分支：`sprint/6-events-registration`。
- 主要 Issue：#17；首个 Issue 分支：`codex/17-event-management`。
- 所有成员 PR base：`sprint/6-events-registration`；一份 PR 只关联一个主要 Issue。
- Sprint 总 PR 主要 Issue：#5；分支 → main 的最终合并须另获授权。
- GitHub 账号：`Kaia-Zhang`；唯一交接对象：Joshua；其他三位只消费已冻结 Event port，不持续共同编辑路由。
- Sprint 6 字段与分支尚未在本次任务创建；启动前由 Joshua 核对实时 Project 和最新 main。

## 1. 独立目标

交付周常活动与比赛的创建、查看、更新，保留数据关系并提供其他功能可消费的可信活动合同。

## 2. 工作包与文件所有权

- 允许修改：`src/features/events/core/`、`editor/`、`src/app/(dashboard)/events/` 基础路由及局部测试；共享生成类型/迁移说明仅按统一计划的串行交接规则持有。
- 禁止修改：其他三位功能成员目录、Joshua 的共享验收/CI/fixture、历史 migration、无关 UI 或权限范围。共享文件例外严格执行统一计划中的单一所有者交接。
- 固定输入：现有 events 表、event_type/status、requires_student_id、可信身份和既有权限 helper；不按旧 Issue 重建已有 schema。
- 输出合同：Event DTO、活动 CRUD/read port、安全 EventSummary 与活动详情插槽；活动要求由服务端读取，不信任客户端传入的 requiresStudentId。
- 功能自身测试：events/core/editor/route 局部测试及 `tests/integration/events/management/`；本 Issue 独占 SQL测试文件；每个功能作者仍自行测试其 SQL。
- 共享平台边界：Joshua 负责跨工作包 harness、共享 fixture、质量配置及 Sprint 级证据；不代替本 Issue 的最低功能测试。

## 3. 开始条件

1. 阅读本 Issue 全文、评论、标签、依赖、验收和 Project 字段，确认当前只启动一个主要 Issue。
2. 最新 Sprint 基线及自己文件范围已核对，无他人未提交重叠修改；创建分支或 GitHub 写操作须有对应授权。
3. 统一周计划合同冻结；provider 暂缺时有虚构 fixture/类型可独立开发，不将 mock 通过声称为真实集成通过。
4. Next.js 编码前读当前安装文档，涉及库/API 先按 Context7 规则查询；权限/数据库改动按仓库权威文档执行。
5. 前周基线已验收合入 main；本周 participants/registrations/events 现有表已经核对，避免重建或扩大权限。

## 4. 独立执行步骤

### 步骤 1：建立并记录基线

执行：核对 #17 和当前 migration/schema；冻结两类活动、允许状态、startsAt/Sydney 展示、requiresStudentId 与明确公开字段，画清路由与三个消费者插槽。

产出：当前 SHA、输入输出合同、局部 fixture、文件清单与验收对应表，写入自己的 PR 交接说明。

检查：每个输入有可信来源或明确 mock；没有未归属共享文件；本 Issue 之外不新增能力。

### 步骤 2：完成核心实现

执行：实现授权边界中的创建/详情/更新及字段错误；保持 id 和所有引用，不删除重建活动；在自己的路由挂载 Xuanwei 的 PreparationPanel 与 Yubo 的安全数字组件。

产出：Event DTO、活动 CRUD/read port、安全 EventSummary 与活动详情插槽；活动要求由服务端读取，不信任客户端传入的 requiresStudentId。

检查：核心行为与 Issue 验收逐条对应；UI 按适用范围覆盖 loading、empty、success、validation error、permission denied、duplicate submission 和 system error；错误不吞噬、不泄露。

### 步骤 3：接入与个人测试

执行：需要数据库修正时只新增本 Issue timestamp SQL 和测试；按 #17→#18→#26→#27→#28 顺序持有共享生成文件，其他成员涉及 schema 的 PR 通过交接由本人生成类型，不能手工修补或覆盖并行生成结果。

验证：E-01/02/03/07；两类活动刷新持久化、必填/未知类型/状态拒绝；匿名不能写或读内部字段；修改活动不丢关联；增量 SQL 的约束/RLS/回滚/类型完整。

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
| 活动更新重建主记录、共享 generated 文件冲突 | 功能验收或冻结合同不满足时立即沟通 | 以保持 eventId 的更新和关系回归验证；按统一计划串行接收迁移、生成、交还各 Issue PR | Li Zhang | 成员 PR 进入 Review 前；阻断首次记录后下一工作日同一时间复查 |
| 上游真实 adapter 未交付 | mock 通过但无法完成最终集成 | 用 fixture 完成本地交付，向 Joshua 记录缺失 provider 与负责 Issue；不假称真实通过 | Li Zhang | 单次集成前；超过一个工作日升级 |

## 9. 未完成项处理

立即记录原因、影响、已尝试操作、所需帮助、本人姓名、首次发现时间和下次检查时间；超过一个工作日升级 Joshua。普通非阻断建议进入 backlog；权限、数据丢失、密钥和 P0 阻断必须先解决。不得改他人文件绕开问题，不因计划已写好就将任务提前标为完成。

## 10. 周末交接

- 已完成：当前仅完成计划编制；执行后填入功能和测试的真实结果。
- 未完成：本计划列出的功能开发、验证、非作者 review 和 Sprint 集成均待执行，由 Li Zhang 在本开发周负责；阻断按第 9 节记录。
- 输出合同：Event DTO、活动 CRUD/read port、安全 EventSummary 与活动详情插槽；活动要求由服务端读取，不信任客户端传入的 requiresStudentId。
- 集成注意事项：只修改明确所有权；消费者从 mock 换到真实 provider 后必须复验；不得手改生成数据库类型。
- Sprint 总 PR 证据：向 Joshua 提供每项 Issue/场景/命令/SHA/review/checks/风险，缺失则标未完成。
- 下周交接：向开发第 7 周提供活动 id、时间/窗口字段、requiresStudentId 和权限合同，不提前开发 QR。
