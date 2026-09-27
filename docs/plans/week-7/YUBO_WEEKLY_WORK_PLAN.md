# Yubo：课程第 8 周（开发第 7 周）独立工作计划

所属统一周计划：[QR 签到与晚餐核验](WEEK_7_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Shiying 的当前签到 read port 和人工更正结果](SHIYING_WEEKLY_WORK_PLAN.md)。

### Sprint 交付路线

- GitHub Sprint：`Sprint 7`；集成分支及成员 PR base：`sprint/7-qr-check-in-dinner`。
- Issue 分支：codex/35-dinner-eligibility；后续 codex/36-dinner-verification、codex/37-dinner-refresh。
- Sprint 总 PR 主要 Issue：#7；本包顺序 Issues：#35 → #36 → #37。
- 唯一交接对象：Joshua；消费者通过统一合同接入，避免多头交接。

## 1. 独立目标

交付晚餐资格与授权核验，覆盖 DINNER-01–04。Yubo（`Caiqwe123`）负责全部功能实现和功能自身验证，估算 11 点；Joshua 负责跨包集成验收。

## 2. 工作包与文件所有权

- 允许修改：`src/features/dinner-verification/`、`src/app/(dashboard)/dinner-verification/`，本 Issue 专属 migration（确有差异时）及局部规则／服务／路由测试。
- 禁止修改：其他三位作者目录、共享验收 harness／CI 和未明确交接的文件；共享文件按统一计划的唯一所有者处理。
- 固定输入：authorised-only 当前活动签到 read port；confirmed/voided/缺失事实；#33 人工成功／失败结果。使用 provider 公共入口，不直接导入其内部 repository。
- 输出合同：资格确定性纯函数、授权核验页面与最小资格汇总；更正后读取当前 DB 的刷新和陈旧反馈；D-01–D-04 验证。
- 功能自身测试：同目录单元／组件、服务／路由集成及 Issue 专属 SQL／权限／回归测试；满足当前 Issue 验收的最低测试不得转给 Joshua。
- 共享验收平台：Joshua 持有跨包 fixture、CI、集成 harness、M4 证据；公共合同只从提供者明确导出的入口消费。

## 3. 开始条件

1. 阅读统一计划及其链接的范围、权限、数据约束、迁移、验收与 Git 规范；核对当前 Issue 正文、评论、标签、负责人、Sprint、依赖和 WIP。
2. 从本 Sprint 基线创建真实 Issue 分支，确认 base/head；每人仅一个主要 Issue 为 In Progress，前项进入 Testing 后再开始后项。
3. Next.js 编码前读取当前安装版本 `node_modules/next/dist/docs/`；库/API 文档按 Context7 规则查询。开发只用虚构数据，禁止打印环境真实值。
4. 周初冻结合同及文件交接；缺实现时用 fixture 完成独立部分，但最终验收必须使用真实 provider。

## 4. 独立执行步骤

### 步骤 1：交付 #35 纯推导

执行：核对 #35/#32 与 DIN-C01–C04；以 eventId 和当前签到事实计算资格。先用 confirmed、voided、缺失、错活动虚构样例独立实现，再接真实 provider。

产出：纯函数、单元测试、数据库事实接入测试和 schema 审查。

检查：只在当前活动 confirmed 时 Eligible，其余 Not Eligible Yet；不创建资格列／表／个人属性。

### 步骤 2：交付 #36 核验页面

执行：#35 进入 Testing 后开始 #36；实现 authorised-only 页面、服务端 query 和必要身份显示；提供当前活动资格人数。复用 #35，覆盖空集、无权限和系统错误。

产出：核验页面、最小 DTO、角色测试和手机／键盘证据。

检查：D-03 三层拒绝；committee、参与者、匿名均无晚餐名单／明细；授权查询不能把整个敏感 DB 行传给 Client Component。

### 步骤 3：交付 #37 更正重算

执行：#36 进入 Testing 且 #33 可复验后启动；下一次核验读取当前 DB，处理成功后刷新、失败保持原值及并发陈旧视图。若另一个页面已打开，给出明确刷新路径并保证刷新结果最新。

产出：真实更正到资格回归、失败／竞争测试、刷新提示。

检查：D-04：confirmed→voided→confirmed 正确；失败不伪改结果；没有独立 eligibility UPDATE。

### 步骤 4：收口个人验证

执行：运行当前活动与错活动、无签到、人工现场例外、未授权直接请求及 schema 无资格写接口检查；录制或截图只用虚构身份。

产出：三个顺序 Issues 各自的测试证据、使用合同、风险和成员 PR。

检查：普通报名仍不能自动获得资格；授权资格汇总和明细使用同一实时事实。

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

- [ ] D-01/02：confirmed、voided、未签到及错误活动准确。
- [ ] D-03：三层权限和字段最小化通过。
- [ ] D-04：真实人工更正后重查、失败和并发路径通过。
- [ ] 没有可编辑资格状态或新增个人属性；UI 状态、汇总和窄屏完成。
- [ ] 只改所有权范围；接口符合统一合同。
- [ ] loading、empty、success、validation error、permission denied、duplicate、system error 均测试或说明不适用。
- [ ] 三层权限、数据唯一性、敏感字段和日志检查通过。
- [ ] 质量命令、功能自身测试和非作者 review 完整。
- [ ] PR 的 Sprint／base／主要 Issue 正确；成员集成后保持 Testing。
- [ ] 未完成项有责任人、期限和下一次检查时间。

## 8. 风险与问题

末尾 #37 依赖人工动作，先用冻结成功结果验证 UI，再等真实 provider 做最终验收；旧缓存或失败假成功阻止当前 PR，不通过修改 Shiying 文件解决。

风险负责人：Yubo。发现即报告 Joshua，安全风险立即处理；一般阻断下一工作日同一 Sydney 时间复查，超过一个工作日升级。

## 9. 未完成项处理

记录原因、影响、已尝试动作、所需帮助、本人责任、开始时间、下一次检查时间。当前包违反输出合同由本人修复；其他包问题交对应所有者，不能越权改文件。安全／P0 阻断不以排期跳过；非阻断项给出负责人和期限，新需求进入 Post-MVP，GitHub 新建／状态修改仍需明确授权。

## 10. 周末交接

2026-09-28：已从 Sprint 7 基线 `f44b64a` 在独立工作目录的 `codex/35-dinner-eligibility` 分支完成 #35 的纯函数与 15 个局部测试；全量 Vitest 636 个通过、3 个既有实际数据库测试跳过，测试运行器 5 个测试通过，ESLint 与类型检查通过。公共入口为 `@/features/dinner-verification`。没有新增资格字段、migration、写接口或个人属性。

#32 的真实 attendance read port 尚未交付，#35 的数据库事实接入和最终验收仍未完成；本次按用户授权以 Draft 成员 PR 交付已完成部分，未变更 Project 状态。按照顺序门禁，#36/#37 尚未启动。完整命令、Schema 核对、边界及待办见[模块交接说明](../../../src/features/dinner-verification/README.md)。

阻断始于 2026-09-28（Sydney）：Shiying 需交付 #32 公共入口，Yubo 接入并补真实 provider 验证，Joshua 独立审查并手动维护状态；下次团队检查建议为 2026-09-29 10:00（Sydney）。目前不存在真实 provider 验收、独立 review 或 M4 完成证明。Joshua 是唯一交接对象。
