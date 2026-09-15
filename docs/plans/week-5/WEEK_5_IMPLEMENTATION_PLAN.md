# 课程第 6 周（开发第 5 周）：Dashboard 与任务跟进

> 依据[《MVP 项目企划书》](../../project/MVP_PROJECT_PROPOSAL.md)第 9 节、[周计划模板](../../templates/WEEK_IMPLEMENTATION_PLAN_TEMPLATE.md)及[验收矩阵](../week-1/artifacts/day-1/DAY_1_P0_ACCEPTANCE_MATRIX.md)。四名成员开发功能，Joshua 负责集成和验收。计划不代表功能已实现或测试已通过。

## 1. 本周目标

闭合“会议 → 决策转任务 → Dashboard 跟进”：本人未完成任务、全部待办、临期和逾期同口径可见；按负责人、状态、日期、活动条件筛选；以文字和图标提示风险；保留近期活动占位区并完成第一次内部可用性走查。对应里程碑 M3，不重复安排开发期 Stakeholder 评审。

### Sprint 交付路线

- GitHub Sprint：`Sprint 5`；集成分支：`sprint/5-dashboard-follow-up`，从最新 `origin/main` 创建。
- 集成负责人、远程分支与 Project 手动维护负责人：Joshua（`Josscui516`）。
- Sprint 总 PR 主要 Issue：#4；其余纳入工作包 Issues：#16、#20、#21、#22。
- 成员 PR base：`sprint/5-dashboard-follow-up`；唯一总 PR：该分支 → `main`。
- 用户在本次任务授权创建 Sprint 5、提交／推送工作区计划，并手动设置这五项的 Sprint 与负责人；未授权的 PR、合并、部署不在本次执行范围内。
- 2026-09-08 核对：PR #70 已于 2026-08-27 合并，`origin/main` 为 `97060b75034d3052ed67898b16bf186637c8fe9e`；Sprint 4 的 #3/#15/#23/#24/#25 均为 Done、Acceptance Gate Passed。旧 README 的 Sprint 4 待合并说明是历史滞后，不能代替实时证据。
- 开始规划时工作区干净，旧本地 Sprint 4 与 main 的文件内容一致。新分支不重推或复活旧 Sprint 4。

### 成员独立工作文档

- [Li：任务筛选及查询](LI_WEEKLY_WORK_PLAN.md)
- [Xuanwei：Dashboard 与全局导航接入](XUANWEI_WEEKLY_WORK_PLAN.md)
- [Shiying：Sydney 临期／逾期规则](SHIYING_WEEKLY_WORK_PLAN.md)
- [Yubo：站内风险提醒](YUBO_WEEKLY_WORK_PLAN.md)
- [Joshua：集成、验收与内部走查](JOSHUA_WEEKLY_WORK_PLAN.md)

### GitHub Project 分配

| 成员 | GitHub 账号 | 唯一主要 Issue | Sprint | 工作量 |
|---|---|---|---|---|
| Li Zhang | `Kaia-Zhang` | #20 | Sprint 5 | 3 点；四类筛选及共同查询口径 |
| Xuanwei Xu | `YUHAN2233` | #21 | Sprint 5 | 5 点；Dashboard 组合、查询及状态 |
| Shiying Liao | `Scarletthekiller` | #16 | Sprint 5 | 3 点；共享日期规则及边界矩阵 |
| Yubo Cai | `Caiqwe123` | #22 | Sprint 5 | 2 点；两处提醒、可访问性和窄屏验证 |
| Joshua Xingjian Cui | `Josscui516` | #4 | Sprint 5 | 约 5 点；跨包验收、集成和走查 |

点数是相对估算，不代表工时；Yubo 同时承担任务与 Dashboard 两处提醒的组件覆盖、窄屏及非颜色提示检查，Shiying 承担日期／DST／异常边界矩阵。每人一个完整产出，Joshua 不接管功能实现或其最低测试。

2026-09-08 已按本次授权手动将以上五项设为 `Sprint 5` 并设置表中唯一负责人；`Status` 保持原有 `Backlog`，Acceptance Gate 保持原值，未标记任何功能开始或验收通过。#20/#21 的原生前置依赖和 Project 依赖摘要已同步下方分阶段决定；#20 的 Target Development Week 同步为 Week 5。其他 Sprint 的分配未变更。

### 1.1 已批准的分阶段验收决定（2026-09-08）

企划书安排开发第 5 周活动占位、第 6 周真实活动；原 #20 依赖 #17、#21 依赖 #19，使完整活动验收跨周。Joshua 在本次任务明确选择按企划书分阶段，并授权同步修订相关 Issue。本决定不删除最终 T-05/T-06 标准：

| 阶段 | 验收归属 | 本阶段必须证明 | 后续责任 |
|---|---|---|---|
| Sprint 5 | #20 / T-05-S5 | 负责人、状态、日期范围及 eventId 的服务端 AND 筛选；用已有 schema 中的虚构活动关系证明 eventId 过滤和统计一致；真实活动管理页面不是前置条件 | #18 在 Sprint 6 从真实活动创建／关联流程复验 T-05 |
| Sprint 5 | #21 / T-06-S5 | 真实任务数据的四项统计及列表；近期活动区域明确为待接入，不显示虚构数字；冻结可替换的 Upcoming port；占位、空集和错误状态不同 | #19 在 Sprint 6 接真实活动并复验完整 T-06 |
| Sprint 5 | #4 / M3 | C-01–C-07 回归、T-01–T-08 中上述明确分阶段部分、内部走查；五项全部通过且总 PR 合入 main 后可完成 Sprint 5 | 最终 RTM 的真实活动 T-05/T-06 仍保持待 Sprint 6 验收，不能标为完整通过 |
| Sprint 6 | #18、#19、#5 | 真实活动创建→任务关联→筛选，真实近期活动→Dashboard 的一致性、时间边界和权限 | 由 Joshua 汇总 E-01–E-07 与完整 T-05/T-06 证据 |

本次只调整与该决定直接相关的 Issue 范围说明及依赖，不把 #17/#19 提前移入 Sprint 5。Project 状态和 Acceptance Gate 保持实际值，分配负责人不自动进入 In Progress、Testing 或 Done。

## 2. 上周输入与开始条件

- Sprint 4 已合并的 TaskRecordDTO、TaskEditorPort、三个持久化状态、会议来源与双向导航可直接复用；不得重写已验收转换流程。
- 当前 `src/features/tasks/list/` 已有 search/status/sort，#20 扩展它，不创建并存的第二套列表筛选。
- Project 需含精确的 #4/#16/#20/#21/#22，Sprint 与负责人按上表人工核对；成员启动前确认自己没有另一主要 Issue In Progress。
- 周初冻结日期返回值、筛选合同、Dashboard port 和提醒插槽；提供者未实现时可用虚构 fixture 开发，集成验收必须换成真实任务查询。
- 读取[结构基线](../week-1/artifacts/day-1/DAY_1_REPOSITORY_STRUCTURE_BASELINE.md)、[派生规则](../week-1/artifacts/day-3/DAY_3_STEP_4_CONSTRAINTS_STATES_AND_DERIVED_RULES.md)、[权限矩阵](../week-1/artifacts/day-3/DAY_3_STEP_5_PERMISSION_MATRIX_AND_CONTROL_POINTS.md)及[Git 约定](../week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md)。Next.js 编码前读取安装包对应文档；库/API 使用按 Context7 规则执行。

## 3. 本周范围

### 3.1 必须完成

`TASK-03`–`TASK-06`：Sydney 日期推导、四类 AND 筛选、本人／全部待办／临期／逾期 Dashboard、站内风险提示、受保护导航和活动占位区；保留 TASK-01/02、CONV-01–05 回归；完成首次团队内部可用性走查。

### 3.2 条件允许时完成

只修复走查发现的本周文案、键盘与窄屏问题。数字卡片和列表足够，不安排额外图表或新功能。

### 3.3 明确不做

活动 CRUD、真实近期活动、参与者／报名／签到／晚餐核验留待后周；不加邮件、短信、推送、定时任务、通知偏好、多负责人或高级依赖。Overdue/Due soon 不进入持久化状态。不得将测试 fixture 放进生产 UI 假装真实数据。

## 4. 五个独立工作包

| 成员 | 工作包 | 主要文件所有权 | 固定输入 | 输出与个人验证 |
|---|---|---|---|---|
| Li | #20 筛选 | `src/features/tasks/list/`、`core/repository.ts` 与其局部测试、`core/index.ts` 必要公共查询导出、tasks 列表 page | TaskRecordDTO、现有状态、日期字符串和安全负责人目录 | 服务端筛选 port、URL 往返、列表及总数同口径；T-05-S5、T-08 |
| Xuanwei | #21 Dashboard | `src/features/dashboard/`、dashboard 路由、全局导航组件与对应测试 | Li 查询 port、Shiying 日期函数、Yubo 提醒组件 | 四项真实任务统计、列表、活动占位与 Upcoming port、导航挂载；T-06-S5、T-08 |
| Shiying | #16 日期规则 | `src/lib/dates/`、`src/features/tasks/due-risk/`，日期单元/集成测试 | dueDate、TaskStatus、显式注入的当前时刻 | 单一 Sydney classifier、边界 fixture；T-03/04 |
| Yubo | #22 提醒 | `src/features/tasks/reminders/` 与组件测试 | classifier 返回结果和任务链接 | 文字+图标提醒、两处可复用组件及窄屏证据；T-07 |
| Joshua | #4 集成验收 | `tests/acceptance/task-follow-up/`、共享 `tests/fixtures/task-follow-up/`、共享配置/CI、week-5 验收文档 | 四人自测 PR、真实 adapter、虚构账号 | 跨包 harness、内部走查、回归、Sprint 证据 |

### PR 路线与集成顺序

| 顺序 | 分支 | PR base | 进入集成条件 |
|---|---|---|---|
| 1 | `codex/16-sydney-task-dates` | `sprint/5-dashboard-follow-up` | T-03/04、异常与 DST 通过 |
| 2 | `codex/20-task-filters` | 同上 | T-05-S5、统计口径、直接拒绝测试通过 |
| 3 | `codex/22-due-risk-reminders` | 同上 | 组件/键盘/窄屏通过，且两处实际宿主在候选集成环境完成挂载验证；不能仅凭 fixture 合并 |
| 4 | `codex/21-task-dashboard` | 同上 | 真实任务查询、T-06-S5/08；接入日期与提醒；Li 在其列表范围挂载提醒 |
| 5 | `codex/4-task-follow-up-acceptance` | 同上 | Joshua 完成跨包测试、走查与证据 |

该顺序是单次集成中的接入顺序，不要求功能成员等待上游实现才开始。#22 原有 #21 依赖表示宿主最终验收，不妨碍先交付提醒组件。集成前先用三位作者各自准备的列表挂载、Dashboard 挂载和提醒组件形成候选组合，验证两处实际渲染；这不是授权成员越界改文件或提前把 #22 标为通过。每个 PR 必须自查、通过 checks 并取得非作者 review 才能合并；合并后保持 Testing。功能 PR 由 Joshua 集中审查；Joshua 的 PR及总 PR由 Li 主审、Shiying 复核日期证据，不能以 Codex 自查代替成员批准。

## 5. 固定接口与文件边界

以下为计划合同，实施前冻结为提供者的类型／测试；不声称这些新函数当前已存在。

| 合同 | 提供者 → 消费者 | 冻结语义 |
|---|---|---|
| DueRisk | Shiying → Li/Xuanwei/Yubo | 输入 dueDate、三个 TaskStatus 之一及显式 now；Sydney 昨天且未完成=overdue，今天至第 7 日含首尾且未完成=dueSoon，第 8 日=normal；completed 不属于风险/待办；无效输入显式 invalid |
| TaskFilterCriteria | Li → Xuanwei | assigneeId、status、dueFrom/dueTo、eventId 可选；日期首尾包含、AND 组合；保留 q/sort 既有语义；非法 UUID/日期/倒置区间显式校验，不能扩大结果集 |
| TaskFollowUpQuery | Li → Xuanwei | 同一条件返回 items 与 total；服务端会话可信，my tasks 的本人 ID 来自服务端，未完成只含 not_started/in_progress；日期规则复用 classifier；分页时 total 不等于当前页长度 |
| Dashboard port | Xuanwei → Yubo/Joshua | 四项任务区独立 empty/error；我的任务默认本人未完成；所有统计使用相同 now 快照和条件；更改任务状态后结果及时刷新 |
| Upcoming port | Xuanwei → Week 6 Xuanwei | `src/features/dashboard/upcoming-events/` 内隔离；未接入、成功空集、成功列表、失败四种可区分结果；安全字段 id/name/startsAt/location，后周 provider 只替换 adapter |
| DueRiskReminder | Yubo → Li/Xuanwei | 仅消费风险分类和链接，输出文字+图标；不查询数据库、不读取独立时钟、不创建另一套日期计算；两位宿主所有者负责挂载 |

### 独占与共享文件

- Li 独占任务列表路由及 list、查询 adapter，Xuanwei 独占 Dashboard 路由、功能根和导航；Yubo 只写提醒子目录，Shiying 只写日期及风险规则，避免同时改同一 page。
- 现有 `tasks/core/contracts.ts` 的 TaskRecordDTO 保持兼容；新筛选公共合同放 Li 的 list 子目录，日期和提醒合同各归提供者，不同时扩大共享类型。
- `src/components/layout/navigation.ts`、`AppNavigation.tsx` 及对应导航测试的本周所有者为 Xuanwei，只改所需导航挂载，不重做整个壳层；`src/proxy.ts`/共享认证不预授权扩展，有保护缺口先交接具体文件。
- 功能局部 unit/integration/route 测试归对应作者；共享 fixture、验收 harness、package/test 配置、CI 归 Joshua。功能作者不得以 Joshua 验收代替自己的成功／失败测试。
- 本周默认不改 schema/RLS。若查询必须增加索引/函数，由 Li 在 #20 提交独立 timestamp migration、三角色测试、生成类型和回滚说明；`database.generated.ts` 与迁移规范该增量部分单一归 Li，其他人不编辑。
- 未列文件默认不动；越界需求由所有者确认后交接，记录接口变化与受影响验收。Joshua 把缺陷退回作者，不在集成中代写功能。

## 6. 三个团队检查点

1. **周初冻结**：确认五项 Project 成员、所有权、上述类型与 fixture、分阶段验收决定及单一 WIP；以后不安排日常全员同步。
2. **单次集成**：四人独立自测后按第 4 节接入真实任务数据；核对提醒两处挂载、统计与筛选一致，只处理合同违约或直接回归。
3. **周末验收**：Joshua 执行跨包回归和第一次内部可用性走查，审查证据和 Sprint 总 PR；五项 Testing、Acceptance Gate Passed 且独立 review 完成后才申请合并。Project 字段由 Joshua 依据证据手动维护。

## 7. 本周交付物

- #16/#20/#21/#22 的代码、功能测试、一次性交接说明及成员 PR。
- Joshua 创建 `TASK_FOLLOW_UP_ACCEPTANCE_RECORD.md` 和 `INTERNAL_USABILITY_WALKTHROUGH.md`，含 fixture、SHA、真实命令、结果、缺陷归属、复验与未完成项。
- 走查使用虚构会议决策生成任务→指定负责人/截止日期→Dashboard 查找→组合筛选→标记完成→统计刷新；记录参与者匿名代号、遇到的问题与是否在少量指导下完成，不虚构人数或成功率。
- 为[开发第 6 周](../week-6/WEEK_6_IMPLEMENTATION_PLAN.md)交付活动 adapter 和筛选合同，明确 T-05/T-06 真实活动部分尚待验收。

## 8. 本周验收清单

- [ ] T-03：昨天、今天、第 7/8 日、Sydney 午夜/DST、闰日/月年边界、无效输入通过。
- [ ] T-04：completed 退出本人未完成、全部待办、临期和逾期，刷新后持续正确。
- [ ] T-05-S5：四类筛选及 AND 组合、清除/URL重载、非法值/倒置范围、空结果、总数一致通过；eventId 使用真实测试数据库中的虚构关系。
- [ ] T-06-S5：本人/全部/临期/逾期真实查询及一致性通过；活动区域诚实占位，失败不显示成零。
- [ ] T-07：任务及 Dashboard 两处文字+图标提醒通过，窄屏/键盘可用，不依赖颜色，无外部通知请求或配置。
- [ ] T-08：committee/authorised 允许，匿名/参与者在 URL、服务端和 RLS 三层拒绝。
- [ ] C-01–C-07、T-01/02 回归通过，来源导航、单一负责人和原有查询行为未退化。
- [ ] 各功能自测与 Joshua 跨包测试分工正确，集成测试非全 mock 通过。
- [ ] 运行 `npm run lint`、`npm run typecheck`、`npm test`、`npm run test:acceptance`、`npm run db:test`、`npm run build`；有 migration 时额外验证重放、并发、lint/diff、生成类型及回滚，命令遵循现有运维文档。
- [ ] 四个成员 PR 与验收 PR 获非作者 review，阻塞 finding 明确负责 Issue、影响和复验方法。
- [ ] 内部走查完成，阻断缺陷为零，未完成项有负责人和期限。
- [ ] 总 PR Issue 集合恰为 #4/#16/#20/#21/#22，与实时 Project 相等；全部阶段验收通过后才合并并判断 Done。
- [ ] 完整 T-05/T-06 的真实活动证据明确移交 #18/#19，未误记最终通过。

## 9. 风险与应对

| 风险 | 信号与影响 | 应对 | 所有者 |
|---|---|---|---|
| 日期各算各的 | 列表与 Dashboard 数字不同 | 注入同一 now，复用唯一 classifier；对相同数据做一致性测试 | Shiying / Li |
| 筛选只作用于当前页 | 页面数量与 total 不同 | 服务端同口径总数，分页边界测试 | Li |
| 提醒与宿主文件冲突 | Yubo 修改列表/page | 子组件独占，Li/Xuanwei 挂载，最终集成复验 | Yubo |
| 占位冒充真实活动 | UI 有伪造近期活动或 T-06 全通过 | 使用明确未接入状态；Sprint 6 在 #19 完成真实验收 | Xuanwei / Joshua |
| 集成负责人接管开发 | Joshua 在功能目录补写业务 | 退回功能作者并记录缺陷归属，自己只做共享验收 | Joshua |
| 旧文档描述覆盖实时证据 | README 称 Sprint 4 未合并 | 以 #70、main SHA、Project 实时读取为本周开始证据 | Joshua |

## 10. 本周完成定义

四个功能包和 Joshua 验收交付物齐全；任务闭环与批准的占位阶段通过，权限、隐私、回归和质量检查通过；内部走查阻断缺陷归零，独立审查完成。经用户授权总 PR 合入 main、必要环境验证完成后，五项 Issue 才能 Done/关闭。最终活动验收由 Sprint 6 承接，不因 Sprint 5 Done 而自动算作通过。

## 11. 未完成项处理

作者当日记录阻断原因、影响、已尝试操作、所需帮助、负责人、开始时间和下一工作日同一时间的复查点；超过一个工作日升级给 Joshua。日期、权限、数据泄露、核心回归或全局构建问题阻止集成；非阻断建议进入 backlog。新增需求默认 Post-MVP，不能替代未完成 P0。计划以教学周为基准，不根据今天日期猜测课程周实际起止日。


## 12. 2026-09-15 本次交付例外与验收结果

Joshua 明确要求先合入剩余 Sprint 5 PR，统一完成缺失功能和 Chrome 视觉／功能验收，再创建 Sprint 5 → main 总 PR。本次其他成员 review／操作不再是前置条件，Joshua 承担集成修复和验收责任；上述日常文件所有权及非作者审查规则不因此永久改变。Codex 自查不被记录为团队批准。

[技术验收记录](TASK_FOLLOW_UP_ACCEPTANCE_RECORD.md)和[Chrome 内部走查](INTERNAL_USABILITY_WALKTHROUGH.md)取代本次交付前的未勾选状态：T-03/04/05-S5/06-S5/07/08 及回归通过，发现的阻断缺陷已修复。走查由 Codex 在 Joshua 授权下执行，没有虚构真人参与者。交付停在总 PR；main 合并及部署、Issues Done／关闭尚未执行。完整活动验收保持 Sprint 6 #18/#19 的范围。
