# Joshua：课程第 5 周（开发第 4 周）独立工作计划

所属统一周计划：[决策转任务与 Sprint 4 阶段评审](WEEK_4_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Li：任务基础 CRUD 与状态约束](LI_WEEKLY_WORK_PLAN.md)、[Xuanwei：来源保留与决策／讨论点转任务](XUANWEI_WEEKLY_WORK_PLAN.md)、[Shiying：转换字段校验与单一负责人](SHIYING_WEEKLY_WORK_PLAN.md)、[Yubo：会议与来源任务双向导航](YUBO_WEEKLY_WORK_PLAN.md)

### Sprint 交付路线

- GitHub Sprint：`Sprint 4`；
- Sprint 集成分支：`sprint/4-decision-to-task`；
- 本工作包 Issue 分支：不另开功能分支；前四个功能 PR 进入 `Testing` 后，在 Sprint 集成分支完成共享验收与收尾；
- Sprint 总 PR base：`main`；
- Sprint 总 PR 主要 Issue：#3；
- 唯一交接对象：Sprint 总 PR 的非作者审查人及 Joshua 指定的 Stakeholder 评审参与者。

## 1. 独立目标

Joshua 不承担功能开发。只有 #15、#23、#24、#25 全部完成个人验收、非作者 review 并进入 `Testing` 后，最后完成 Sprint 4 跨包集成、C-01 至 C-07 与必要任务回归、权限／隐私／migration 复核、`US_02_ACCEPTANCE_RECORD.md`、本项目唯一一次开发期 Stakeholder 阶段评审和 Sprint 总 PR 收尾。

## 2. 工作包与文件所有权

- 成员姓名：Joshua Xingjian Cui；
- 独立工作包：WP-E Sprint 4 集成、共享验收、阶段评审与交付收尾；
- 主要 Issue：#3；
- 允许修改：`tests/acceptance/decision-to-task/`、`tests/fixtures/decision-to-task/`、`docs/plans/week-4/US_02_ACCEPTANCE_RECORD.md`、阶段评审记录、Sprint 集成证据和总 PR 描述；仅在明确归属为集成 harness 的缺陷时修改共享测试配置；
- 禁止修改：Li、Xuanwei、Shiying、Yubo 的功能实现和功能自身测试；发现功能缺陷退回对应 Issue／所有者；
- 固定输入合同：四个已进入 `Testing` 的功能 PR、公开 DTO／ports／adapters、C-01–C-07 场景、T-01／T-02／T-08 回归、Project Sprint 成员和 review/checks 证据；
- 输出合同：跨包 harness、虚构 fixture、验收记录、Stakeholder 评审材料与反馈分类、Sprint 总 PR 和下周 Ready 交接；
- 功能自身测试：不适用；由四名功能所有者完成；
- 共享验收平台边界：Joshua 拥有跨包 harness、fixture、Sprint 级命令执行、证据汇总与验收判定，但不替代功能最低测试。

## 3. 开始条件

- 周初只做只读协调：手动核对 #3、#15、#23、#24、#25 的 Sprint、assignee、依赖、状态和 Acceptance Gate；任何 GitHub 写入仍需用户对相应操作的明确授权；
- Sprint 3 已合入 `main`，Sprint 4 集成分支、四个成员 PR 的 base/head 和纳入 Issue 集合真实可核对；
- #15、#23、#24、#25 均已完成自测、非作者 review、checks 并合入 Sprint 分支，状态保持 `Testing`；
- Joshua 当前没有另一个主要 Issue 处于 `In Progress`；前述条件满足前，不开始 #3，也不预先实现功能；
- Stakeholder 评审只使用通过内部验收的虚构数据版本，参与者和时间已确认。

## 4. 独立执行步骤

### 步骤 1：周初只读门禁与收尾框架准备

执行：

1. 只读核对统一计划、四份成员文档、Issue 内容、Project 字段、Sprint 分支和文件所有权；
2. 冻结 C-01–C-07 adapter／fixture shape、证据字段和阶段评审议程，不编写功能实现；
3. 明确阻塞记录模板、非作者审查人、Stakeholder 评审窗口和总 PR Issue 集合。

产出：只读门禁清单和待四个功能包完成后启用的验收框架说明。

检查：#3 未提前进入 `In Progress`，Joshua 未修改功能目录或开始第二个主要工作。

### 步骤 2：按序接收功能工作包

执行：

1. 按 #15 → #23 → #24 → #25 核对各 PR 的主要 Issue、base/head、文件所有权、验收证据和 review；
2. 将 finding 分类为当前 PR 缺陷、冻结合同／接口缺陷、其他工作包缺陷或既有／范围冲突；
3. 只接收已通过个人验收和非作者 review 的工作包，合并后保持其 Issue 为 `Testing`；
4. 四项全部进入 `Testing` 后，才开始 #3 与共享验收。

产出：四个工作包的单次集成记录和缺陷归属记录。

检查：没有由 Joshua 越权修复功能缺陷，没有成员 PR 直接进入 `main`。

### 步骤 3：Sprint 级验收与回归

执行：

1. 建立或接通只消费公开接口的 C-01–C-07 harness 和虚构 fixture；
2. 运行 decision／discussion 成功转换、缺失字段、双负责人、双向导航、duplicate、missing source 和 anonymous／participant deny；
3. 复跑 T-01、T-02、T-08 以及受影响的会议回归，核对 route／server／RLS、外键、单一负责人、migration 顺序／回滚和生成类型；
4. 运行 `npm run lint`、`npm run typecheck`、应用测试、数据库测试、数据库 lint／drift（适用时）和 `npm run build`，如实记录命令与结果；
5. 将证据写入 `US_02_ACCEPTANCE_RECORD.md`，阻断缺陷退回对应所有者复验。

产出：Sprint 4 可重复验收证据与清楚的通过／未通过判断。

检查：缺失功能会使 harness 失败；验收工具不复制业务逻辑；敏感值和真实资料不进入日志或文档。

### 步骤 4：Stakeholder 阶段评审与 Sprint 总 PR

执行：

1. 只在内部门禁通过后演示“会议 → 决策／讨论点 → 任务 → 返回来源会议”，并说明下一阶段 Dashboard 方案但不演示未实现功能；
2. 记录 Stakeholder 对核心工作方式的确认、P0 澄清和新增建议；新增能力默认分类为 Post-MVP，不现场扩展 Sprint；
3. 核对 Project 中 `Sprint 4` 的完整 Issue 集合与总 PR 的 #3、#15、#23、#24、#25 完全一致；
4. 创建或更新从 `sprint/4-decision-to-task` 到 `main`、以 #3 为主要 Issue 的 Sprint 总 PR，包含 checks、权限、隐私、migration、风险与回退证据；
5. 取得新的非作者 review、全部 checks 和对所有 thread 的处理；合并必须另获用户明确授权，合并前不得把 Issues 标为 `Done`。

产出：阶段评审记录、Sprint 总 PR、集成验收证据和开发第 5 周 Ready 交接。

检查：PR Issue 集合等于 Project Sprint 成员，反馈分类不扩大 MVP，merge 与 Project 写入权限分别核对。

## 5. 低频沟通规则

- 前四个功能包 `Testing` 前，Joshua 只做周初门禁和只读准备，不开展功能或集成实现；
- 成员独立期间不持续催同步，只有合同阻断、安全问题或超过约定时间的 blocker 才协调；
- review finding 退回正确 Issue／所有者，不要求当前作者跨工作包修复；
- Stakeholder 反馈集中记录并分类，不在评审中即时派生实现任务。

## 6. 个人交付物

- Sprint 4 单次集成记录和 review finding 归属；
- C-01–C-07 harness、虚构 fixture、T-01／T-02／T-08 回归与完整质量证据；
- `docs/plans/week-4/US_02_ACCEPTANCE_RECORD.md`；
- Stakeholder 阶段评审议程、演示证据、反馈分类和决定记录；
- Sprint 总 PR、风险／回退说明及开发第 5 周 Ready 交接。

## 7. 个人验收清单

- [ ] Joshua 在四个功能包 `Testing` 后才开始 #3；
- [ ] 未修改其他成员功能实现或替代其最低测试；
- [ ] #15、#23、#24、#25 的 PR、review、checks、base/head 和 `Testing` 状态真实可核对；
- [ ] C-01–C-07、T-01／T-02／T-08 与受影响会议回归通过；
- [ ] route／server／RLS、来源外键、单一负责人、duplicate 和 missing source 通过；
- [ ] lint、typecheck、应用测试、数据库测试和 build 通过；
- [ ] `US_02_ACCEPTANCE_RECORD.md` 使用虚构数据且可复验；
- [ ] Stakeholder 阶段评审仅使用通过内部门禁的集成版本；
- [ ] 反馈已分类为 P0 澄清或 Post-MVP，没有静默扩大本周范围；
- [ ] Sprint 总 PR 的 Issue 集合与 Project `Sprint 4` 成员一致；
- [ ] 未经明确授权没有 merge、关闭 Issue 或标记 `Done`；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| 任一功能包未进入 `Testing` | #3 无法开始，阶段评审版本不完整 | 周末收尾门禁前仍缺 PR／review／checks | 记录 blocker 并退回所有者；不由 Joshua 接管实现 | Joshua | 下一检查点 |
| Project Sprint 成员与总 PR 不一致 | Sprint PR 不可审查／不可完成 | #3、#15、#23–#25 集合或字段漂移 | 手动逐项核对；修正文档／Project 后要求新的非作者 review | Joshua | PR 前 |
| Stakeholder 提出范围扩展 | 破坏冻结 P0 与排期 | 新能力不是对既有 C 场景的澄清 | 记录到 Post-MVP；正式等量替换需团队决定并更新权威文档 | Joshua | 评审当日 |
| 集成缺陷归属错误 | Joshua 或错误作者越界修复 | finding 涉及另一工作包或冻结合同 | 按 PR review 缺陷归属分类，退回提供者并记录复验方法 | Joshua | 发现当日 |

## 9. 未完成项处理

- 任一功能包未到 `Testing`，#3 保持未开始或未完成，Stakeholder 演示延期或仅作明确标注的非验收预览；
- C-01–C-07、权限、数据完整性或全局构建失败会阻止 Sprint 总 PR；
- 合同缺陷退回提供者，Joshua 不通过修改功能目录绕过；
- 新需求进入 Post-MVP，不能替代未完成的 `US-02`；
- blocker 记录原因、影响、已尝试操作、所需帮助、负责人、开始时间和下次检查时间，超过一个工作日升级。

## 10. 周末交接

- 已完成：四个工作包集成、C-01–C-07 验收、阶段评审和 Sprint 总 PR 准备；
- 未完成：逐项记录 Issue、原因、负责人、期限、下次检查和是否阻断 Sprint PR；
- 输出合同：验收 harness、fixture、`US_02_ACCEPTANCE_RECORD.md`、阶段评审记录和总 PR 证据；
- 集成注意事项：只有总 PR 合入 `main` 后整组 Issues 才能判断 `Done`；
- Sprint 总 PR 证据：#3 为主要 Issue，#15、#23、#24、#25 为 included work packages，附完整 checks／review／权限／migration／回退摘要；
- 下周建议：在稳定 task DTO 和状态合同上启动 #16、#20–#22，不把 Stakeholder 新建议混入开发第 5 周 P0。
