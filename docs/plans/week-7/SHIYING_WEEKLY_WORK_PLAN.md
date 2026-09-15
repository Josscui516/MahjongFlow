# Shiying：课程第 8 周（开发第 7 周）独立工作计划

所属统一周计划：[QR 签到与晚餐核验](WEEK_7_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Xuanwei 的 QR 签到输出](XUANWEI_WEEKLY_WORK_PLAN.md)。

### Sprint 交付路线

- GitHub Sprint：`Sprint 7`；集成分支及成员 PR base：`sprint/7-qr-check-in-dinner`。
- Issue 分支：codex/32-attendance-audit；后续 codex/33-manual-attendance。
- Sprint 总 PR 主要 Issue：#7；本包顺序 Issues：#32 → #33。
- 唯一交接对象：Joshua；消费者通过统一合同接入，避免多头交接。

## 1. 独立目标

交付签到审计与人工更正，覆盖 CHECKIN-05/06。Shiying（`Scarletthekiller`）负责全部功能实现和功能自身验证，估算 8 点；Joshua 负责跨包集成验收。

## 2. 工作包与文件所有权

- 允许修改：`src/features/attendance/records/`、`manual/`，本 Issue 专属增量 migration、数据库测试及局部组件／服务测试。
- 禁止修改：其他三位作者目录、共享验收 harness／CI 和未明确交接的文件；共享文件按统一计划的唯一所有者处理。
- 固定输入：当前 attendance schema 和 Xuanwei confirmed+qr 写入；可信当前 authorised 会话；既有参与者事实。不要求 #34 页面完成才能开发自己的审计／人工组件。
- 输出合同：authorised-only Attendance read port、最小审计 DTO 和可独立渲染的显示组件；ManualAttendancePanel(eventId)、补签／void／恢复动作和最小成功结果。
- 功能自身测试：同目录单元／组件、服务／路由集成及 Issue 专属 SQL／权限／回归测试；满足当前 Issue 验收的最低测试不得转给 Joshua。
- 共享验收平台：Joshua 持有跨包 fixture、CI、集成 harness、M4 证据；公共合同只从提供者明确导出的入口消费。

## 3. 开始条件

1. 阅读统一计划及其链接的范围、权限、数据约束、迁移、验收与 Git 规范；核对当前 Issue 正文、评论、标签、负责人、Sprint、依赖和 WIP。
2. 从本 Sprint 基线创建真实 Issue 分支，确认 base/head；每人仅一个主要 Issue 为 In Progress，前项进入 Testing 后再开始后项。
3. Next.js 编码前读取当前安装版本 `node_modules/next/dist/docs/`；库/API 文档按 Context7 规则查询。开发只用虚构数据，禁止打印环境真实值。
4. 周初冻结合同及文件交接；缺实现时用 fixture 完成独立部分，但最终验收必须使用真实 provider。

## 4. 独立执行步骤

### 步骤 1：核对审计基线

执行：读取 #32 与 #31 输出；按 ATT-C01–C08 检查现有字段、唯一性、method/status 枚举、manual/voided 的 recorded_by 条件及 updated_at 触发器。

产出：精确差异清单、最小 DTO 与虚构 QR/manual 样例。

检查：已存在的字段与约束复验后复用，不重建；列出 read port 的授权和 eventId 范围。

### 步骤 2：交付 #32 审计合同

执行：补齐缺失审计行为，提供仅 authorised 使用的 read port 和显示组件；展示活动、必要身份、签到时间、方式、操作者、更新时间。

产出：公共合同、可独立验收组件、SQL／RLS 测试与 K-05 证据。

检查：QR recorded_by 可空，manual 与 voided 必须有可信操作者；committee/匿名不接收 DTO。

### 步骤 3：交付 #33 人工操作

执行：#32 进入 Testing 后开始 #33；实现人工补签、confirmed↔voided 更正，操作者来自会话，时间来自可信边界。现场无报名例外可人工处理，但不自动创建报名；提供组件给 Li 挂载。

产出：人工表单／动作、原子更新、confirmation 和错误反馈；成功输出 eventId 与更新版本／时间。

检查：失败与无权限零变更；QR/manual 竞争一行；不提供删除纠错或直接资格写接口。

### 步骤 4：验证更正与消费者合同

执行：用既有读 port 复验更正后的状态、审计和时间；把可复验的成功／失败结果提供给 Joshua，供 Li/Yubo 集成。执行并发、权限与局部组件检查。

产出：K-04/05/06 证据、测试命令、回退说明及交接包。

检查：不要导入晚餐内部逻辑或修改 Li 路由；只向消费者提供公共合同，避免循环依赖。

### 步骤 5：成员 PR 与一次性交接

执行：整理单一 Issue 的 diff、公共输出、测试和回退；按授权创建指向 Sprint 分支的成员 PR，正文英文。完成作者自查、Joshua 非作者审查及必需 checks；若 schema／RLS 变化，交 Li 工具生成类型和整理迁移说明，再由作者复验。顺序 Issue 各自独立 PR，不合并成多主要 Issue PR。

产出：给 Joshua 的完整工作包，包含各 Issue／SHA／PR、命令结果、角色矩阵、虚构 UI 证据、依赖与剩余风险。

检查：成员合入 Sprint 后保持 Testing；不得提前关闭或标 Done，不将自己的测试当作非作者批准。

## 5. 低频沟通规则

周初冻结一次合同；实现期间独立推进，不安排每日全员同步。仅在接口无法满足、阻断或安全问题时临时沟通；所有权变化由当前所有者明确交接。完成后向 Joshua 一次性交接工作包，在集中集成窗口按依赖接入并完成非作者审查。

## 6. 个人交付物

- 本包功能、公共合同和必要 migration／回退说明。
- 对应每个 Issue 的功能自身测试及实际命令输出；新增签到竞争测试不能仅引用既有报名竞争命令。
- 适用 `npm run lint`、`npm run typecheck`、`npm test`、`npm run db:test`、`npm run build` 结果；DB 变化补重放、lint、diff、生成一致性，未执行明确说明。
- 虚构数据的界面状态／权限证据、独立 PR 和一次性交接包。

## 7. 个人验收清单

- [ ] K-05：QR/manual 审计显示与字段约束完整。
- [ ] K-06：补签、void、恢复保存当前操作者与更新时间。
- [ ] K-04：QR/manual 竞争、失败和未授权操作保持数据正确。
- [ ] 未报名人工例外不改变报名计数；成功结果足够晚餐页重新读取。
- [ ] 只改所有权范围；接口符合统一合同。
- [ ] loading、empty、success、validation error、permission denied、duplicate、system error 均测试或说明不适用。
- [ ] 三层权限、数据唯一性、敏感字段和日志检查通过。
- [ ] 质量命令、功能自身测试和非作者 review 完整。
- [ ] PR 的 Sprint／base／主要 Issue 正确；成员集成后保持 Testing。
- [ ] 未完成项有责任人、期限和下一次检查时间。

## 8. 风险与问题

人工更正覆盖 QR 原始元数据或接受客户端操作者会破坏审计；以冻结 ATT 规则测试状态转换，差异由本包修复。页面挂载缺失退回 Li，不跨文件修补。

风险负责人：Shiying。发现即报告 Joshua，安全风险立即处理；一般阻断下一工作日同一 Sydney 时间复查，超过一个工作日升级。

## 9. 未完成项处理

记录原因、影响、已尝试动作、所需帮助、本人责任、开始时间、下一次检查时间。当前包违反输出合同由本人修复；其他包问题交对应所有者，不能越权改文件。安全／P0 阻断不以排期跳过；非阻断项给出负责人和期限，新需求进入 Post-MVP，GitHub 新建／状态修改仍需明确授权。

## 10. 周末交接

当前仅完成计划编制，功能、测试、PR 和验收均待执行；不能填写虚假完成状态。交接时将各 Issue 的已完成场景、未完成原因与责任期限、公共入口、实际 SHA／checks／review、migration 顺序和回退写入本文件。Joshua 据此执行 M4 集成，下一周接全项目内部验收。
