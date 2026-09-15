# 课程第 7 周（开发第 6 周）：活动、报名与 Dashboard 活动接入

> 依据[《MVP 项目企划书》](../../project/MVP_PROJECT_PROPOSAL.md)第 9 节及[周计划模板](../../templates/WEEK_IMPLEMENTATION_PLAN_TEMPLATE.md)。本周交付活动运营的数据基础；所有功能由 Li、Xuanwei、Shiying、Yubo 实现，Joshua 负责集成、共享验收和交付。本文是执行计划，不是功能完成证明。

## 1. 本周目标

委员会可以维护周常活动与比赛、关联筹备任务、查看简单进度及真实近期活动；授权人员可以登记最少参与者资料、报名及取消报名。报名不产生签到或晚餐资格，普通委员会只接收安全聚合。

### Sprint 交付路线

- 计划 GitHub Sprint：`Sprint 6`；计划集成分支：`sprint/6-events-registration`。
- 本次只生成 Sprint 6 文档，不创建该分支或修改其 Project 字段。启动时从届时最新 `main` 创建，不能直接以未合并的 Sprint 5 分支为基线。
- 集成负责人、Project 手动维护负责人：Joshua（`Josscui516`）。
- Sprint 总 PR 主要 Issue：#5；其余计划纳入 Issues：#17、#18、#19、#26、#27、#28。
- 成员 PR 指向 `sprint/6-events-registration`；唯一 Sprint 总 PR 路线为该分支 → `main`。
- #6 是跨周报名 Epic，其子项 #29 的 PRIV-04／R-07 计划在开发第 8 周完成，因此 #6 不加入 Sprint 6 的可关闭成员集合。Joshua 只汇总其 #26/#27/#28 子项证据，不能提前关闭 #6 或把 #29 悄悄移入本周。
- 2026-09-08 读取 Project 时，上述七项均为 `Backlog`、未分配 Sprint 和负责人。下表是计划，不代替启动时的实时核对。

### 成员独立工作文档

- [Li：活动基础流程](LI_WEEKLY_WORK_PLAN.md)
- [Xuanwei：筹备任务、进度与近期活动](XUANWEI_WEEKLY_WORK_PLAN.md)
- [Shiying：最小参与者身份](SHIYING_WEEKLY_WORK_PLAN.md)
- [Yubo：报名流程与报名／签到分离](YUBO_WEEKLY_WORK_PLAN.md)
- [Joshua：集成与活动／报名验收](JOSHUA_WEEKLY_WORK_PLAN.md)

## 2. 上周输入与开始条件

- [开发第 5 周](../week-5/WEEK_5_IMPLEMENTATION_PLAN.md)的任务、日期、筛选、提醒及 Dashboard 合同已进入可复验基线；Sprint 5 总 PR 合并及验收状态必须现场确认。
- 2026-09-08 读取的已有数据库类型含 `events`、`participants`、`registrations`、`tasks.event_id`、`requires_student_id` 和隐私确认时间字段。实现前核对最新 migration，不按旧 Issue 的“Add schema”字样重新创建已有表。
- 必读[权限矩阵](../week-1/artifacts/day-3/DAY_3_STEP_5_PERMISSION_MATRIX_AND_CONTROL_POINTS.md)、[数据约束](../week-1/artifacts/day-3/DAY_3_STEP_4_CONSTRAINTS_STATES_AND_DERIVED_RULES.md)、[迁移规范](../../operations/DATABASE_MIGRATIONS.md)及[验收矩阵](../week-1/artifacts/day-1/DAY_1_P0_ACCEPTANCE_MATRIX.md)。
- Joshua 核对实时 Sprint 成员、账号、依赖、Acceptance Gate 和每人 WIP；所有者冻结下列公共合同后，消费者可先用虚构 fixture 开发。
- Next.js 实现者先读取安装版本的 `node_modules/next/dist/docs/`；库/API 使用按仓库规则查询 Context7。本文不提前变更应用代码、数据库或环境。

## 3. 本周范围

### 3.1 必须完成

- `EVENT-01`–`EVENT-05`：活动创建、详情、更新、单一活动任务关联、`完成数/总数`、近期活动。
- `REG-01`–`REG-07`、`PRIV-01`–`PRIV-03`：最小参与者资料、授权后台报名、取消／恢复、去重、安全聚合及报名／签到分离。
- 把 Sprint 5 活动占位区接入真实查询；复验 T-05 的真实活动筛选与 T-06 的真实近期活动。
- 每个功能自带成功、失败、边界、权限和适用 UI 状态测试；Joshua 提供跨包验收。

### 3.2 条件允许时完成

修复本周走查发现的非阻断文案与窄屏问题；不得挤占权限、并发唯一性和 P0 验收。

### 3.3 明确不做

QR/token、签到写入、人工补签、晚餐核验留给开发第 7 周；不新增 P1 公开自助报名、CSV 导出、支付、营销、活动模板或外部通知。#29 的清理执行工具不纳入本周；本周测试仍须使用虚构数据并按现有维护规则处理。

## 4. 五个独立工作包

| 成员／账号 | 工作包与 Issue | 专属主要文件 | 固定输入 | 输出及个人验证 | 估算 |
|---|---|---|---|---|---|
| Li / `Kaia-Zhang` | A 活动基础 #17 | `src/features/events/core/`、`editor/`，events 路由基础文件 | 当前身份、现有 events schema | 活动 CRUD、安全 Event DTO；E-01/02/03/07 | 5 点 |
| Xuanwei / `YUHAN2233` | B 筹备与近期活动，顺序 #18 → #19 | `src/features/events/preparation/`、`upcoming/`，任务活动编辑插槽、Dashboard 活动插槽 | Event DTO、TaskRecordDTO、Sprint 5 筛选及活动 port | 关联、2/3 与 0/0、排序及真实 Dashboard 接入；E-04/05/06、T-05/06 | 7 点 |
| Shiying / `Scarletthekiller` | C 参与者身份 #26 | `src/features/registrations/participants/` | 可信活动要求、当前 authorised 身份、participants schema | trim/标准化/条件学号、身份匹配及最小表单；R-01/02/06/08 | 5 点 |
| Yubo / `Caiqwe123` | D 报名操作，顺序 #27 → #28 | `src/features/registrations/records/`、`attendance-summary/`，registrations 路由 | Participant port、Event DTO、现有报名唯一约束 | 授权名单、登记／取消／恢复、幂等与安全聚合、签到分离；R-03/04/05/08 | 8 点 |
| Joshua / `Josscui516` | E #5 集成验收，收集 #6 报名证据 | `tests/acceptance/events-registration/`、共享 fixture/配置、CI、week-6 证据文档 | 四个已自测工作包及一次性交接包 | 跨包真实流程、权限／迁移／回归、独立 review 与 Sprint 总 PR | 约 6 点，不含功能实现 |

估算沿用现有 Issue 点数作相对比较。Yubo 复用 Shiying 的身份组件与 port，Xuanwei 复用已交付 task filter，避免重复实现；超载时先升级拆解交付顺序，不把功能转给 Joshua。

### PR 路线与集成顺序

| 顺序 | Issue 分支 | base | 条件 |
|---|---|---|---|
| 1 | `codex/17-event-management` | `sprint/6-events-registration` | E-01/02/03/07、自测、非作者 review、checks |
| 2 | `codex/18-event-preparation`、`codex/26-participant-identity` | 同上 | 分别满足冻结 port 与功能验收，可独立交付 |
| 3 | `codex/19-upcoming-events`、`codex/27-registration-management` | 同上 | 各自前项进入 Testing，再开始下一主要 Issue |
| 4 | `codex/28-registration-attendance-separation` | 同上 | #27 进入 Testing，R-04/05 与 UI/聚合测试 |
| 5 | `codex/5-events-registration-acceptance` | 同上 | Joshua 接收四人全部功能，完成 #5/#6 证据及跨包验收 |

一个成员 PR 只关联一个主要 Issue。#18/#19、#27/#28 是同一成员工作包的顺序独立交付，不并行占用两个主要 `In Progress`。非作者审查在各交付物完成后集中进行一次；功能包由 Joshua 审查，Joshua 的验收 PR 和 Sprint 总 PR由 Li 主审、Shiying 复核隐私，实际批准必须来自非作者。

## 5. 固定接口与文件边界

以下是本周待周初冻结的计划合同，不声称已存在实现。

| 合同 | 提供者 → 消费者 | 固定内容 |
|---|---|---|
| Event DTO / read port | Li → 其余功能包 | id、name、eventType、startsAt、location、description、status、requiresStudentId；时间持久化沿用当前 schema，展示使用 Sydney；不含参与者和 token |
| 页面插槽 | Li → Xuanwei、Yubo | 活动详情由 Li 组合，调用 PreparationPanel(eventId) 及安全人数组件；各消费者只改自己的子组件，路由挂载由 Li 完成 |
| 筹备 port | Xuanwei → Li | 受保护的任务关联／解除，最多一个 eventId；保留来源会议／决策及其他字段；进度由现有任务即时推导 |
| Upcoming port | Xuanwei → Dashboard | `startsAt >= now`，按 startsAt、id 稳定排序；安全 EventSummary；真空集与查询错误分开；替换 Sprint 5 adapter，不重写 Dashboard |
| Participant port | Shiying → Yubo | 可信 eventId 派生 requiresStudentId；只接收姓名、邮箱、条件学号；结果为 authorised-only id 与必要显示字段，安全的 validation/permission/system 错误 |
| 报名 port | Yubo → 活动详情、验收 | eventId + participantId 唯一；Registered/Cancelled；重复不增行；报名不写 attendance；普通委员会只能接收 eventId 与数字 |
| 日期与筛选 | Sprint 5 公共合同 → Xuanwei | 复用同一 AND 规则及 URL 参数；#18 负责真实 event 选项适配，不能复制另一套筛选器 |

### 跨文件独占规则

- `src/app/(dashboard)/events/` 基础 page/layout/loading/error、events/core/editor 与相关 route 测试归 Li；`preparation/`、`upcoming/` 归 Xuanwei。
- Xuanwei 本周接收 `src/features/dashboard/upcoming-events/` 和 `src/features/tasks/event-link/`、任务编辑器中仅活动字段挂载部分、任务筛选中的活动选项 adapter；Week 5 所有者在交接中确认后才编辑，其余任务/Dashboard 文件不扩权。
- Shiying 独占 `registrations/participants/` 和身份局部测试；Yubo 独占报名路由及 `records/`、`attendance-summary/` 和报名局部测试。不得通过共享 registrations 根 barrel 造成双重所有权；公共 port 放在提供者目录中。
- 新 migration 各自按所属 Issue 创建不同 timestamp 文件，测试用 `issue-17-*`、`issue-18-*`、`issue-26-*`、`issue-27-*`、`issue-28-*` 区分，不编辑历史 SQL。
- `src/types/database.generated.ts` 与 `docs/operations/DATABASE_MIGRATIONS.md` 的共享合并由 Li 单一持有：按 #17 → #18 → #26 → #27 → #28 顺序接收 SQL及说明，每个涉及 schema 的成员 PR 在合并前交接给 Li 运行生成工具并补齐生成结果，其他人不得同时编辑。Joshua 验收重放与生成一致性，不手工修补类型。
- `supabase/seed.sql`、共享 `tests/fixtures/events-registration/` 和验收配置归 Joshua；功能作者使用 Issue 专属虚构 fixture。共享认证／proxy若发现缺口，由当前具体功能 Issue 提出并显式交接，未解决时阻止集成，不自行跨目录修改。
- 未明确列出的文件保持原样；接口不能满足时由提供者修订合同并通知直接消费者、Joshua，在本周计划记录原因、影响和复验方式。

## 6. 三个团队检查点

1. **周初合同冻结**：核对最新 main、七项候选 Sprint 成员、所有权、port、迁移顺序、角色与验收。冻结后各人用 fixture 独立推进，不安排每日全员同步。
2. **单次集成**：按第 4 节顺序接入经过自测和非作者 review 的 PR。消费者换成真实 provider，作者自己修复输出违约；成员 Issue 保持 Testing。
3. **周末验收**：Joshua 运行全链路及权限矩阵，核对 #5 + 六项纳入 Issues 与 Project 完全相等，取得独立 review。只有全部验收通过且用户授权总 PR 合并到 main 后，Joshua 才手动判断这七项 Issue 的 Done/关闭；#6 继续等待 #29。

## 7. 本周交付物

- 四个功能工作包的六项 Issue 实现、局部测试、PR 和接口说明。
- Joshua 创建 `EVENTS_REGISTRATION_ACCEPTANCE_RECORD.md`，逐条记录 E-01–E-07、R-01–R-06/R-08、T-05/T-06 与权限证据，未执行项明确标为未执行。
- Joshua 更新 RTM 的实际覆盖、migration 顺序／回滚验证及开发第 7 周输入；不把 R-07 清理工具或签到功能写成已交付。
- 有真实 SHA、命令结果、review、阻塞及负责人信息的 Sprint 总 PR 交接包；截图只用虚构资料。

## 8. 本周验收清单

- [ ] E-01/02/03：两类活动正确保存、重载；无效类型／状态／字段不产生行。
- [ ] E-04/05：2/3、0/0 正确；修改活动保留任务、报名和已有虚构签到关联。
- [ ] E-06、T-05/06：过去活动排除、当前及未来正确排序；真实活动筛选与 Dashboard 一致。
- [ ] R-01/02/06：姓名／邮箱规范化；普通活动学号可空、要求学号时必填；排除字段不落库；无不完整记录。
- [ ] R-03：首次、并发重复、取消／恢复均不产生第二报名行，数字一致。
- [ ] R-04/05：后台代录可无隐私确认时间；仅报名不产生签到、Attended 或资格；P1 自助页面保持未启用。
- [ ] E-07、R-08：committee/authorised/匿名在路由、服务端及数据库上允许／拒绝正确；响应无敏感字段泄露。
- [ ] 四人分别提供功能测试；Joshua 的跨包 harness 调用真实适配器，不能仅以 mock 通过代替验收。
- [ ] lint、typecheck、应用测试、验收测试、数据库约束／RLS／并发、build 及 migration 顺序／回滚全部通过。
- [ ] 完成一次集中非作者审查；阻塞 finding 有归属、负责 Issue 和复验方法。
- [ ] Project Sprint 成员与总 PR 精确一致，全部真实验收后才申请合并；没有提前 Done。
- [ ] Week 7 输入具备活动 id/窗口字段、参与者匹配 port、报名状态、安全聚合和三角色虚构 fixture。

## 9. 风险与应对

| 风险 | 信号与影响 | 应对 | 所有者 |
|---|---|---|---|
| 活动与报名互相等待 | provider 未实现导致停工 | 先冻结最小 port，用局部 fixture；仅真实集成验收等待 provider | Li / Shiying |
| Yubo 负载较高 | #27 尚未 Testing，#28 已开始 | 严格顺序交付，复用身份表单；不把最低测试移交 Joshua | Yubo |
| 生成类型多人覆盖 | PR 含互相覆盖的生成 diff | 按明确顺序交接 Li 生成，各 PR 入集成前完整验证 | Li |
| 敏感数据混入普通活动响应 | 聚合带 participantId/个人字段 | DTO 白名单，直接接口与 RLS 拒绝测试；立即阻止合并 | Yubo / Shiying |
| 仅改活动日期却丢关联 | update 删除重建活动或关联 | 保持主键，回归已有任务／报名／签到关系 | Li / Xuanwei |
| 前周验收未收口 | T-05/T-06 只有 fixture 或占位证据 | 接真实 adapter 复验；不冒充历史已通过 | Joshua |

## 10. 本周完成定义

六项功能 Issue 均有独立实现与测试，#5 的 Sprint 验收和 #6 的已交付子项证据可追踪；活动→筹备与授权报名真实运行，Dashboard 活动接入，权限和关系不退化；质量门禁及独立审查通过，阻断缺陷为零。总 PR 合入 main 且必要环境验证完成后，这七项 Sprint Issues 才可标 Done；#6 保持未完成，直到后周 #29 也通过。新功能需求留在 Post-MVP。

## 11. 未完成项处理

阻断记录由具体功能所有者提供原因、影响、已尝试动作、所需帮助、开始时间、下次检查时间，Joshua 汇总；首次发现当日记录，下一工作日同一时间复查，超过一个工作日升级。接口缺陷回到提供者，Joshua 不代写功能。非阻断项明确负责人和期限；权限、数据完整性、P0 未通过不得以工期为由跳过。日期按课程周安排，不把当前系统日期自动当作教学周起始日。
