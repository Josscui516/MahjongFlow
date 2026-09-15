# Joshua：课程第 8 周（开发第 7 周）独立工作计划

所属统一周计划：[QR 签到与晚餐核验](WEEK_7_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Li](LI_WEEKLY_WORK_PLAN.md)、[Xuanwei](XUANWEI_WEEKLY_WORK_PLAN.md)、[Shiying](SHIYING_WEEKLY_WORK_PLAN.md)、[Yubo](YUBO_WEEKLY_WORK_PLAN.md)。四份都是实际集成输入。

### Sprint 交付路线

- GitHub Sprint：`Sprint 7`；集成分支：`sprint/7-qr-check-in-dinner`。
- 本包分支：`codex/7-check-in-dinner-acceptance`；#8 若需独立文件交付，后续使用 `codex/8-dinner-acceptance`；成员 PR base 均为 Sprint 分支。
- 主要集成 Issue／Sprint 总 PR 主要 Issue：#7；#8 是晚餐验收汇总。
- 完整 Sprint 集合：#7、#8、#30、#31、#32、#33、#34、#35、#36、#37。
- 唯一交接对象：Li，负责本包和 Sprint 总 PR 的非作者审查；Shiying 复核安全证据。

## 1. 独立目标

Joshua（`Josscui516`）只负责集成和验收，估算约 9 点，不接管四人的功能开发。证明 M4 的真实活动→报名→签到→晚餐链路、权限与数据完整性；提供准确的交付／风险记录，计划分配不等于实现完成。

## 2. 工作包与文件所有权

- 允许修改：`tests/acceptance/check-in-dinner/`、`tests/fixtures/check-in-dinner/`、共享 CI／测试配置、`supabase/seed.sql`，本周统一计划、README 计划链接、RTM 和集成验收记录。
- 禁止修改：Li、Xuanwei、Shiying、Yubo 的功能目录、功能路由、业务 SQL 或局部测试；生成类型与迁移规范共享文件归 Li，不手工修补。
- 固定输入：四个已自测工作包的公共合同、PR、SHA、真实测试结果、虚构 fixture、迁移顺序和风险。
- 输出：可重复跨包 harness、K/D 逐场景证据、权限绕过与并发复验、M4 判断、独立审查和 Sprint 总 PR 交接。
- 功能自身测试归作者；本包测试覆盖真实适配器之间的组合关系，不复制一套签到或资格业务逻辑。

## 3. 开始条件

1. 核对最新 main、#84 合并和报名功能验收；#6 仍含后周 #29，不以关闭整个报名 Epic 作为本周功能已完成证明。
2. 实时读取十项 Issue／Project Sprint、Assignee、Status、Acceptance Gate、评论和依赖；核对每人 WIP。仅按实际证据及明确授权手动改字段。
3. 四人冻结统一计划中的输入输出、文件所有权、迁移顺序及最小 fixture；未交付 provider 可用于 harness 搭建的 mock，但不能用于最终 M4 通过结论。
4. #7 为本人唯一主要 In Progress；#8 可收集证据，待 #7 进入 Review／Testing 后顺序完成 #8 的验收汇总，避免两个主要任务同时 In Progress。
5. 本周恢复正常非作者审查门禁，不沿用 Sprint 6 一次性豁免；验收只用隔离虚构数据，不输出环境值或个人数据。

## 4. 独立执行步骤

### 步骤 1：冻结范围与交付路线

执行：核对 #7 主 Issue、#8 与八个功能项的实际 Project 成员、账号、状态和分支；确认 Li 的共享类型生成窗口。记录基线 SHA 和 #6/#29 的跨周边界；检查每个工作包能通过公共合同独立推进。

产出：统一计划的已确认输入、十项映射与阻断清单。

检查：没有重复 Issue、第二个 Sprint 总 PR、错误 Sprint 成员或未经确认的完成状态；本次只手动分配 Sprint／负责人。

### 步骤 2：准备共享验收

执行：建立隔离虚构场景，包括 scheduled／cancelled 活动、窗口前／开／关、要求学号与否、registered／cancelled 报名、confirmed／voided／缺失签到、committee／authorised／匿名／无有效 profile。固定时钟，覆盖 Sydney 夏令时；准备真实适配器切换点。

产出：跨包 fixture、K-01–K-08、D-01–D-04 harness 和覆盖表。

检查：不依赖真实身份或生产环境；测试调用真实功能入口，不能将自己的模拟实现当作通过。

### 步骤 3：集中接入四人工作包

执行：按 #30 → #31 → #32，随后 #33/#34/#35，再 #36/#37 的依赖顺序接入。各 PR 先通过作者验证、非作者 review 与 checks；核对 SQL 对象唯一写入和 Li 生成类型。将消费者 fixture 替换为真实 provider，完成一次集中集成。

产出：每项 Issue 的 PR／SHA／测试／review 记录，以及接口／功能／既有缺陷分类。

检查：本 PR 引入且属于其合同的缺陷退回作者；其他包问题退回对应 Issue，不自己代写。成员合入 Sprint 后保持 Testing，不提前关闭。

### 步骤 4：完成 M4 真实验收

执行：创建虚构活动与报名，实际解码 QR 并打开；测试有效签到、无效／撤销／过期、重复／并发、人工补签、void／恢复、晚餐重算。对直接页面、服务端和 DB 分别做角色允许／拒绝；检查安全统计、响应／日志最小化。复验会议、任务、活动、报名与 Dashboard。

运行仓库现有 `npm run lint`、`npm run typecheck`、`npm test`、`npm run test:acceptance`、`npm run db:test`、`npm run db:test:concurrency`、`npm run db:lint`、`npm run db:diff`、`npm run build`，并运行 #31/#33 的新增签到竞争命令。记录实际命令，不能假定既有报名竞争脚本已覆盖签到。

在隔离本地虚构数据库检查从干净状态重放、从 Sprint 6 schema 升级、迁移顺序、工具生成一致性、回退和再次运行；不对真实环境 reset。部署方案先 SQL 后应用，回退先停公开写入／撤销入口，保留已产生的审计数据。

产出：后续创建 `QR_CHECK_IN_DINNER_ACCEPTANCE_RECORD.md`，记录 SHA、环境类别、时间、场景、预期／实际、命令结果、截图与缺陷归属；随后在 #8 汇总 D 场景证据。

检查：全部关键行为是真实集成测试；未执行、失败、仅 mock 均显式标注，不能写成通过。

### 步骤 5：独立审查和 Sprint 总 PR 交接

执行：把本包 PR 和证据交 Li 审查、Shiying 复核权限。所有纳入工作包进入 Testing 后，按授权准备唯一 Sprint 总 PR；正文英文、主要 #7，Included work package issues 为 #8/#30–#37。再次核对完整集合与 Project 精确相等、各项验收及 checks/review threads。

产出：Sprint 总 PR 交接包、M4 验收结论及开发第 8 周输入。

检查：不把 Codex 自查当团队批准；PR 成员编辑后重新核对并要求新 review。仅在总 PR 经明确授权合入 main、必要环境复验和各项 Gate 人工确认 Passed 后，Joshua 才手动更新 Done／关闭；已 Done 不重复变更，Done 但 open 的项目继续核实后关闭。

## 5. 低频沟通规则

只设置周初冻结、工作包完成后的集中集成、周末验收三个检查点。功能所有者向 Joshua 一次性提交完整工作包；Joshua 汇总后交 Li。仅合同冲突、安全或阻断增加同步，不安排持续结对，不静默扩大作者范围。

## 6. 个人交付物

- 五人合同与 Project 成员映射；每个 PR 的真实 base/head、主要 Issue 和独立 review。
- 共享 fixture／跨包 harness、权限／并发／回归／迁移／回退结果。
- K-01–K-08、D-01–D-04 与 M4 验收记录；#7/#8 汇总证据。
- 经授权的 Sprint 总 PR 和后周内部验收输入、阻断与回退说明。

## 7. 个人验收清单

- [ ] 四位功能作者交付完整，作者最低测试没有转给本人。
- [ ] 本人没有跨所有权写功能或手工改生成类型。
- [ ] 实际解码 QR、并发唯一性、人工更正和晚餐重算均通过。
- [ ] 三角色及无有效 profile 的页面／接口／数据库权限和字段最小化通过。
- [ ] UI 状态、桌面／手机／键盘流程和既有功能回归通过。
- [ ] lint、typecheck、应用／验收／DB／专属竞争测试和 build 有实际结果。
- [ ] 干净重放、Sprint 6 升级、类型一致性、回退有证据。
- [ ] Li 对本人交付和总 PR 作非作者审查，Shiying 复核权限；缺陷正确归属。
- [ ] 十项 Sprint 集合与总 PR 一致，无提前 Done 或关闭。
- [ ] 未完成项有负责人、期限和下次检查时间；#29 留给开发第 8 周。

## 8. 风险与问题

| 风险 | 影响 | 处理 | 负责人／期限 |
|---|---|---|---|
| 功能依赖未完成 | M4 只能 mock 通过 | 退回具体作者，真实验收保持未通过 | Joshua 当日记录，下一工作日复查 |
| 类型或 SQL 冲突 | 集成不可重放 | 交 Li 按顺序生成；作者修复自身 migration | Li，合入前 |
| 安全／并发用例缺失 | 产生越权或重复签到 | 阻止相关 PR 和 Sprint 交付 | 对应功能作者，验收前 |
| 验收作者自行批准 | 门禁失效 | 交 Li／Shiying 独立复核 | Joshua，总 PR 前 |

## 9. 未完成项处理

记录原因、影响、尝试动作、所需帮助、负责人、Sydney 开始时间、下次检查时间；超过一个工作日升级。安全、P0、数据完整性或集成阻断不能静默带到下周；非阻断项明确负责人和期限，新需求保留 Post-MVP。GitHub 新建／状态迁移依实际授权执行。

## 10. 周末交接

目前仅完成计划，功能与 M4 尚待实施验收。周末逐项填写完成／未完成、真实证据、缺陷负责人与期限、接口版本、迁移／回退、review／checks 和最终部署复验；由 Li 接收。下一周集中做全项目内部验收与 #29 隐私清理，不用后周工作掩盖本周缺失的最低验证。
