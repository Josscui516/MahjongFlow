# Li：课程第 8 周（开发第 7 周）独立工作计划

所属统一周计划：[QR 签到与晚餐核验](WEEK_7_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Shiying 的签到审计 DTO 与人工组件](SHIYING_WEEKLY_WORK_PLAN.md)。

### Sprint 交付路线

- GitHub Sprint：`Sprint 7`；集成分支及成员 PR base：`sprint/7-qr-check-in-dinner`。
- Issue 分支：codex/30-event-check-in-token；后续 codex/34-attendance-views。
- Sprint 总 PR 主要 Issue：#7；本包顺序 Issues：#30 → #34。
- 唯一交接对象：Joshua；消费者通过统一合同接入，避免多头交接。

## 1. 独立目标

交付QR 入口管理与授权签到视图，覆盖 CHECKIN-01/02/07。Li（`Kaia-Zhang`）负责全部功能实现和功能自身验证，估算 10 点；Joshua 负责跨包集成验收。

## 2. 工作包与文件所有权

- 允许修改：`src/features/attendance/tokens/`、`views/`、`aggregation/`，`src/app/(dashboard)/attendance/`，活动详情 page／导航测试中的本周入口，`src/features/registrations/attendance-summary/`。共享生成类型、迁移说明、必要 package/lockfile 及认证 guard 窄改动按统一计划由 Li 单一持有。
- 禁止修改：其他三位作者目录、共享验收 harness／CI 和未明确交接的文件；共享文件按统一计划的唯一所有者处理。
- 固定输入：既有活动／角色合同；Shiying 提供的 authorised-only Attendance read port、审计显示和 ManualAttendancePanel。#34 可先使用冻结 DTO 的虚构 fixture。
- 输出合同：受保护 token 管理、窗口配置、一次性 URL／QR；供 Xuanwei 使用的 token/context 服务端公共 port；授权签到页与安全聚合；供其他作者顺序使用的工具生成类型。
- 功能自身测试：同目录单元／组件、服务／路由集成及 Issue 专属 SQL／权限／回归测试；满足当前 Issue 验收的最低测试不得转给 Joshua。
- 共享验收平台：Joshua 持有跨包 fixture、CI、集成 harness、M4 证据；公共合同只从提供者明确导出的入口消费。

## 3. 开始条件

1. 阅读统一计划及其链接的范围、权限、数据约束、迁移、验收与 Git 规范；核对当前 Issue 正文、评论、标签、负责人、Sprint、依赖和 WIP。
2. 从本 Sprint 基线创建真实 Issue 分支，确认 base/head；每人仅一个主要 Issue 为 In Progress，前项进入 Testing 后再开始后项。
3. Next.js 编码前读取当前安装版本 `node_modules/next/dist/docs/`；库/API 文档按 Context7 规则查询。开发只用虚构数据，禁止打印环境真实值。
4. 周初冻结合同及文件交接；缺实现时用 fixture 完成独立部分，但最终验收必须使用真实 provider。

## 4. 独立执行步骤

### 步骤 1：建立 token 基线

执行：核对 #30 及 #17 验收、活动窗口与 token 表现有约束。把缺失功能映射到 TOKEN-C01–C07 与 EVENT-C04–C07；冻结 token/context 公共入口及原子校验的数据库合同。

产出：字段／函数差异表、虚构 context 样例和边界测试列表。

检查：确认不是重复建表；窗口为 opens_at <= now < closes_at，活动必须 scheduled。

### 步骤 2：交付 #30 QR 管理

执行：实现 authorised-only 生成、撤销、轮换和窗口编辑；至少 32 随机字节、只存摘要、明文仅一次显示。输出真正可解码 QR；后台普通 JWT 与窄 elevated token 操作分离。需要依赖时只由本包修改 package 与 lockfile。

产出：QR 管理组件、token/context port、Issue 专属 migration、局部测试及回退说明。

检查：K-01/03：解码后活动正确；轮换旧 token 失效；临界窗口／取消活动拒绝；禁止日志与响应泄露摘要或个人信息。

### 步骤 3：交付 #34 签到列表

执行：#30 进入 Testing 后再开始 #34；等 #32 read port 验收后接真实 provider。实现授权签到页并组合 Shiying 审计／人工组件；复用安全人数组件和现有聚合 RPC；挂载 QR、签到与晚餐入口。

产出：授权列表及 loading/empty/error、三角色路由和响应测试、活动人数刷新。

检查：K-07/08、X-05：committee 只有 eventId 和人数；匿名不能读明细；人工组件挂载不改写其业务逻辑；已有报名／筹备入口保留。

### 步骤 4：完成共享文件接力与个人验证

执行：按统一计划 SQL 顺序在每个 PR 的交接窗口生成类型、整合回退说明，再交还作者验证；必要 guard 变更保留公开签到入口。执行本包全部测试与质量检查。

产出：各 Issue 独立 PR 所需的完整类型／migration／测试证据。

检查：不得手工补类型、改历史 SQL、覆盖其他作者分支或把共享协调当作接管功能。

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

- [ ] K-01/03 的 QR 实际解码、轮换、撤销和窗口边界通过。
- [ ] K-07/08 的页面、服务端、DB 拒绝与安全聚合白名单通过。
- [ ] Shiying 组件真实挂载，签到更正后人数更新且报名仍独立。
- [ ] 生成类型与迁移重放一致，所有共享文件只有一个当前写入者。
- [ ] 只改所有权范围；接口符合统一合同。
- [ ] loading、empty、success、validation error、permission denied、duplicate、system error 均测试或说明不适用。
- [ ] 三层权限、数据唯一性、敏感字段和日志检查通过。
- [ ] 质量命令、功能自身测试和非作者 review 完整。
- [ ] PR 的 Sprint／base／主要 Issue 正确；成员集成后保持 Testing。
- [ ] 未完成项有责任人、期限和下一次检查时间。

## 8. 风险与问题

token 管理与公开提交合同不一致时停止相关合并，由 Li 修订合同、通知 Xuanwei 和 Joshua；#34 暂缺审计 provider 时用 fixture，不冒充真实验收。

风险负责人：Li。发现即报告 Joshua，安全风险立即处理；一般阻断下一工作日同一 Sydney 时间复查，超过一个工作日升级。

## 9. 未完成项处理

记录原因、影响、已尝试动作、所需帮助、本人责任、开始时间、下一次检查时间。当前包违反输出合同由本人修复；其他包问题交对应所有者，不能越权改文件。安全／P0 阻断不以排期跳过；非阻断项给出负责人和期限，新需求进入 Post-MVP，GitHub 新建／状态修改仍需明确授权。

## 10. 周末交接

当前仅完成计划编制，功能、测试、PR 和验收均待执行；不能填写虚假完成状态。交接时将各 Issue 的已完成场景、未完成原因与责任期限、公共入口、实际 SHA／checks／review、migration 顺序和回退写入本文件。Joshua 据此执行 M4 集成，下一周接全项目内部验收。
