# Joshua：课程第 4 周（开发第 3 周）共享验收与 Sprint 收尾计划

所属统一周计划：[会议记录流程与 Sprint 3 收尾](WEEK_3_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Li 的会议领域服务](LI_WEEKLY_WORK_PLAN.md)、[Xuanwei 的 agenda 输出](XUANWEI_WEEKLY_WORK_PLAN.md)、[Yubo 的会议编辑 UI](YUBO_WEEKLY_WORK_PLAN.md)、[Shiying 的历史输出](SHIYING_WEEKLY_WORK_PLAN.md)。

### Sprint 交付路线

- GitHub Sprint：`Sprint 3`；
- Sprint 集成分支：`sprint/3-meeting-management`；
- 本工作包：Epic #2 的共享验收、Sprint 集成与收尾，不另开业务功能分支；
- Sprint 总 PR：`sprint/3-meeting-management` → `main`；
- Sprint 总 PR 主要 Issue：#2；
- 唯一交接对象：`main` 的授权合并者／仓库管理员；
- 启动门禁：#12、#13、#14 和 #56 全部进入 `Testing` 后，Joshua 才把 #2 作为本周唯一主要 `In Progress` 工作，并建立共享 harness。

## 1. 独立目标

最后完成 Sprint 3 的共享验收与收尾：不接管四个成员的功能文件，在集成分支上建立虚构 fixture 和可失败的 M-01 至 M-06 harness，核对 Project Sprint 成员，执行权限／隐私／migration／回归检查，形成 `US_01_ACCEPTANCE_RECORD.md`，并准备以 #2 为主要 Issue 的 Sprint 总 PR。

## 2. 工作包与文件所有权

- 成员姓名：Joshua；GitHub assignee：`Josscui516`；
- 独立工作包：WP-E 共享验收、Sprint 3 集成与收尾；
- 主要 Issue：#2；
- 允许修改：`tests/acceptance/meetings/`、`tests/fixtures/meetings/`、共享测试编排的最小增量、`docs/plans/week-3/US_01_ACCEPTANCE_RECORD.md`、Sprint 集成证据和总 PR 描述；
- 禁止修改：Li 的 core／server、Xuanwei 的 agenda、Yubo 的 editor／路由、Shiying 的 history／列表、各成员专属测试、数据库 migration／RLS；
- 固定输入合同：四个功能工作包已 `Testing`、M-01–M-06 公开 adapters、Project `Sprint 3` 成员、Sprint 分支完整 diff；
- 输出合同：可失败的 M-01–M-06 harness、虚构 fixture、US-01 验收记录、完整命令结果、review finding 归属、Sprint 总 PR 证据和收尾交接；
- 功能自身测试：harness 成功／故意失败自检、fixture 隔离、adapter 完整性和命令退出码；不复制四个功能包的业务逻辑；
- 共享验收平台边界：Joshua 拥有共享 harness、fixture 与 Sprint 级证据；功能缺陷退回对应 owner。

## 3. 开始条件

- #12、#13、#14 和 #56 已通过个人验收、非作者 review 并为 `Testing`；
- 四个成员 PR 已合并到 `sprint/3-meeting-management`；
- GitHub Project 中 `Sprint 3` 的完整 Issue 集合可读取；
- #2 的 assignee、Sprint、Status、Acceptance Gate 与依赖已确认；
- 工作树和 Sprint 分支无来源不明的未提交改动；
- 用户尚未授权的 commit、push、PR 或 merge 操作不得自行执行。

## 4. 独立执行步骤

### 步骤 1：建立 Sprint 收尾与验收基线

执行：

1. 只读核对 Project `Sprint 3` 成员与计划声明；
2. 核对四个成员 PR 的 base/head、主要 Issue、checks、review 和 `Testing` 状态；
3. 核对完整 Sprint diff、文件所有权和冻结合同；
4. 确认无成员把 #23–#25 或 Post-MVP 能力带入本 Sprint；
5. 将 M-01–M-06 映射为前置 fixture、公开 adapter、预期结果和责任 Issue。

产出：Sprint 3 收尾基线、验收矩阵与差异清单。

检查：Issue 集合不匹配、成员未 `Testing` 或合同未交接时停止总 PR。

### 步骤 2：建立共享 harness 并完成集成验收

执行：

1. 建立只含虚构会议和角色的共享 fixture，并保证重复运行相互隔离；
2. 建立 M-01–M-06 harness，只消费四个功能包的公开页面、port 和 adapter；
3. 验证缺少任一 adapter、跳过断言或故意破坏 fixture 时命令必须失败；
4. 运行 lint、typecheck、应用测试、数据库测试和 build；
5. 执行 M-01 至 M-06，复核 committee／authorised allow 和 anonymous／participant route／server／RLS deny；
6. 复核 migration 顺序、回滚、生成类型、无永久 delete 和虚构数据；
7. 对发现按当前 PR、接口／集成、其他工作包／既有缺陷或范围冲突分类。

产出：共享 harness、自检证据、完整集成与风险结论。

检查：阻断项为零；非阻断项有正确 Issue／owner，不越界修复。

### 步骤 3：形成验收与总 PR 材料

执行：

1. 创建 `US_01_ACCEPTANCE_RECORD.md`，记录 harness 自检、场景、命令、结果、权限和剩余风险；
2. 准备英文 Sprint 总 PR 正文，以 #2 为唯一主要 Issue；
3. `Included work package issues` 精确列出 #12、#13、#14 和 #56；
4. 记录 UI 状态、数据库／RLS／回滚、隐私、截图使用虚构数据和回退方式；
5. 经用户明确授权后才执行对应 Git／GitHub 写操作。

产出：验收记录与可审查的 Sprint 总 PR 材料。

检查：Project Sprint 成员与 PR 声明逐项一致。

### 步骤 4：最终收尾与交接

执行：

1. Sprint 总 PR 创建后等待非作者 review 与所有 checks；
2. 解决 review 时按缺陷归属退回责任成员，不接管其文件；
3. 合并到 `main` 必须另行取得用户明确授权；
4. 合并后才核对整组 Issue `Done`／关闭、部署和 Week 4 Ready 输入；
5. 未合并时保持整组 Issues 为 `Testing`，不得提前关闭。

产出：Sprint 3 最终交接包。

检查：状态与实际 GitHub、部署和验收结果一致。

## 5. 低频沟通规则

- 前四包执行期间只冻结验收合同和做只读准备，不编写假装已接入的 harness，也不把 #2 移入 `In Progress`；
- 只在 Project 成员不一致、接口阻断、安全问题或全局检查失败时沟通；
- 发现功能缺陷退回对应 owner，不直接修改；
- 总 PR 前集中一次验收，避免反复打断成员；
- merge 是独立授权，不能由创建 PR 的授权推断。

## 6. 个人交付物

- Sprint 3 Project／PR／Issue 一致性核对；
- M-01–M-06 验收矩阵、共享 harness 和虚构 fixture；
- `US_01_ACCEPTANCE_RECORD.md`；
- lint、typecheck、应用测试、数据库测试、build 和 M-01–M-06 证据；
- 权限、隐私、migration、回滚、无 delete 与范围复核；
- Sprint 总 PR 材料和最终交接。

## 7. 个人验收清单

- [ ] 前四个工作包均在 Joshua 开始前进入 `Testing`；
- [ ] #2 是 Joshua 唯一主要 `In Progress` Issue；
- [ ] Project Sprint 成员与总 PR Issue 集合完全一致；
- [ ] M-01–M-06 均有 adapter、fixture 和断言，缺失集成时 harness 失败；
- [ ] harness 成功／故意失败与 fixture 隔离自检通过；
- [ ] M-01–M-06 完整集成全部通过；
- [ ] route／server／RLS 权限和无永久 delete 通过；
- [ ] lint、typecheck、应用测试、数据库测试和 build 通过；
- [ ] migration／RLS／生成类型／回滚影响已审查；
- [ ] review findings 已按正确 owner／Issue 归属；
- [ ] 总 PR base/head、主要 Issue、纳入 Issues 与英文正文正确；
- [ ] 未经明确授权未 merge；合并前整组 Issues 保持 `Testing`；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| 前四包未全部 Testing | 无法合法收尾 | 任一 PR、review、check 或验收缺失 | #2 不开始，退回对应 owner 完成 | Joshua／对应 owner | 收尾开始前 |
| Project 与 PR Issue 集合不一致 | Sprint 总 PR 不可创建或需退回 Review | 成员、主要 Issue 或 Sprint 字段不匹配 | 先修正事实源并重新取得非作者 review | Joshua | 总 PR 前 |
| harness 复制功能逻辑 | 形成第二套事实源 | 测试中重新实现验证、排序或 UI 状态 | 改为公开 adapter 编排，功能断言退回责任 Issue | Joshua | 请求 review 前 |
| 集成缺陷被 Joshua 越界修复 | 所有权冲突 | 缺陷位于成员输出合同／文件 | 分类后退回责任 Issue，Joshua 只修 harness／复验 | Joshua | 发现后立即 |
| merge 授权缺失 | 外部状态越权 | checks 通过但用户未明确同意 | 保持 PR 可审查，不合并、不改 Done | Joshua | 取得授权前 |

## 9. 未完成项处理

- harness 无法证明缺失集成失败，或任一 M 场景、权限、安全、数据一致性、全局 build 失败时，阻止总 PR 完成；
- Project 成员未知时不凭文档推断；
- 非阻断缺陷经授权记录到正确 backlog；
- 不通过直接改成员文件绕过阻断；
- 新需求进入 Post-MVP。

## 10. 周末交接

- 已完成：按真实结果填写 Sprint 集成、US-01 验收与总 PR 状态；
- 未完成：列出责任 Issue、owner、影响、期限和下次检查；
- 输出合同：共享 harness、虚构 fixture、验收记录、命令结果、PR／Project 一致性和风险摘要；
- 集成注意事项：#2 只在四个功能包进入 `Testing` 后开始共享验收和最后收尾，不是第五个并行业务实现；
- Sprint 总 PR 证据：#2、纳入 Issues、checks、review、M-01–M-06、权限与 migration 摘要；
- 下周建议：把稳定 agenda 只读输出交给 #23–#25，保持会议模块所有权边界。
