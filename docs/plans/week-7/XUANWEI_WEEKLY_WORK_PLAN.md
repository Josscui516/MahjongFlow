# Xuanwei：课程第 8 周（开发第 7 周）独立工作计划

所属统一周计划：[QR 签到与晚餐核验](WEEK_7_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Li 的 token/context 合同](LI_WEEKLY_WORK_PLAN.md)。

### Sprint 交付路线

- GitHub Sprint：`Sprint 7`；集成分支及成员 PR base：`sprint/7-qr-check-in-dinner`。
- Issue 分支：codex/31-atomic-self-check-in。
- Sprint 总 PR 主要 Issue：#7；本包顺序 Issues：#31。
- 唯一交接对象：Joshua；消费者通过统一合同接入，避免多头交接。

## 1. 独立目标

交付匿名签到与原子去重，覆盖 CHECKIN-03/04。Xuanwei（`YUHAN2233`）负责全部功能实现和功能自身验证，估算 8 点；Joshua 负责跨包集成验收。

## 2. 工作包与文件所有权

- 允许修改：`src/features/attendance/self-check-in/`、`src/app/check-in/[token]/`、`src/app/api/check-in/[token]/`，本 Issue 专属 SQL、限速边界与功能测试。
- 禁止修改：其他三位作者目录、共享验收 harness／CI 和未明确交接的文件；共享文件按统一计划的唯一所有者处理。
- 固定输入：Li token/context 公共 port；已交付 #26 参与者规范化规则与 #27 registered 报名事实；现有活动／签到约束。不得通过匿名调用后台 Participant port 绕过 authorised 检查。
- 输出合同：PG-03 最小签到表单、公开 API、同事务完整校验与单行写入、安全幂等响应；局部数据库并发和非枚举证据。
- 功能自身测试：同目录单元／组件、服务／路由集成及 Issue 专属 SQL／权限／回归测试；满足当前 Issue 验收的最低测试不得转给 Joshua。
- 共享验收平台：Joshua 持有跨包 fixture、CI、集成 harness、M4 证据；公共合同只从提供者明确导出的入口消费。

## 3. 开始条件

1. 阅读统一计划及其链接的范围、权限、数据约束、迁移、验收与 Git 规范；核对当前 Issue 正文、评论、标签、负责人、Sprint、依赖和 WIP。
2. 从本 Sprint 基线创建真实 Issue 分支，确认 base/head；每人仅一个主要 Issue 为 In Progress，前项进入 Testing 后再开始后项。
3. Next.js 编码前读取当前安装版本 `node_modules/next/dist/docs/`；库/API 文档按 Context7 规则查询。开发只用虚构数据，禁止打印环境真实值。
4. 周初冻结合同及文件交接；缺实现时用 fixture 完成独立部分，但最终验收必须使用真实 provider。

## 4. 独立执行步骤

### 步骤 1：冻结公开输入输出

执行：核对 #31、#30/#26/#10 依赖及现有 schema；先用固定 context fixture 搭建表单。仅收 email 和活动要求时的 studentId，eventId 来自 token。

产出：最小输入验证、公开响应联合类型和威胁路径测试表。

检查：既不增加姓名／电话等字段，也不返回名单、身份是否存在或晚餐结果。

### 步骤 2：实现原子签到

执行：通过 server-only 窄 RPC 在同一事务内重验 token、撤销、scheduled 状态、数据库时钟、当前活动报名与身份。依赖 event+participant 唯一性处理并发；QR 只首次写 confirmed+qr。

产出：受限提交适配器、增量 SQL、回退说明及服务／数据库测试。

检查：K-02/03/04：撤销与提交竞争安全；重复 confirmed 或 voided 均不新增、不恢复、不改审计字段。

### 步骤 3：完成公开 UI 与限速

执行：实现有效／不可用页面、提交反馈、重复和可重试系统错误；在敏感查询前执行请求大小／形状验证与来源+token 限速、失败退避。部署多实例下的限速必须有效；缺依赖由 Li 统一接入。

产出：公开页面/API、限速与错误映射测试、无敏感内容的诊断结果。

检查：匿名直连业务表／RPC 被拒绝；client 无通用 elevated client；日志不含 token/email/studentId 或请求正文。

### 步骤 4：复验真实竞争与窗口

执行：把 fixture 换成真实 Li provider；运行顺序重复、QR/QR 竞争、关闭窗口和 token 轮换竞争；为 Shiying 的 QR/manual 复验提供公共输入及基线输出。

产出：真实数据库行数、状态、审计字段验证和可重复运行命令。

检查：不能只靠禁用按钮或先查后插；成功／失败／限速和 Sydney 夏令时边界均有证据。

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

- [ ] K-02/03/04：有效一次成功，无效零写入，并发最终一行。
- [ ] QR 不恢复 voided，不改已有审计属性；公开响应不枚举个人信息。
- [ ] K-08：匿名仅能当前操作，直连表与未授权函数拒绝。
- [ ] 真实 provider、限速和窗口边界通过，局部测试不是仅 mock。
- [ ] 只改所有权范围；接口符合统一合同。
- [ ] loading、empty、success、validation error、permission denied、duplicate、system error 均测试或说明不适用。
- [ ] 三层权限、数据唯一性、敏感字段和日志检查通过。
- [ ] 质量命令、功能自身测试和非作者 review 完整。
- [ ] PR 的 Sprint／base／主要 Issue 正确；成员集成后保持 Testing。
- [ ] 未完成项有责任人、期限和下一次检查时间。

## 8. 风险与问题

token 前置检查与实际插入分离会产生竞态；发现时由本包将重验纳入事务，Li 负责提供者合同调整。限速不可仅宣称进程内计数已满足部署环境。

风险负责人：Xuanwei。发现即报告 Joshua，安全风险立即处理；一般阻断下一工作日同一 Sydney 时间复查，超过一个工作日升级。

## 9. 未完成项处理

记录原因、影响、已尝试动作、所需帮助、本人责任、开始时间、下一次检查时间。当前包违反输出合同由本人修复；其他包问题交对应所有者，不能越权改文件。安全／P0 阻断不以排期跳过；非阻断项给出负责人和期限，新需求进入 Post-MVP，GitHub 新建／状态修改仍需明确授权。

## 10. 周末交接

当前仅完成计划编制，功能、测试、PR 和验收均待执行；不能填写虚假完成状态。交接时将各 Issue 的已完成场景、未完成原因与责任期限、公共入口、实际 SHA／checks／review、migration 顺序和回退写入本文件。Joshua 据此执行 M4 集成，下一周接全项目内部验收。
