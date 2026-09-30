# Shiying：课程第 8 周（开发第 7 周）独立工作计划

所属统一周计划：[QR 签到与晚餐核验](WEEK_7_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Xuanwei 的 QR 签到输出](XUANWEI_WEEKLY_WORK_PLAN.md)。

### Sprint 交付路线

- GitHub Sprint：`Sprint 7`；集成分支及成员 PR base：`sprint/7-qr-check-in-dinner`。
- Issue 分支：codex/32-attendance-audit；后续 codex/33-manual-attendance。
- Sprint 总 PR 主要 Issue：#7；本包顺序 Issues：#32 → #33。
- 唯一交接对象：Joshua；消费者通过统一合同接入，避免多头交接。

### 2026-09-28 用户批准的本次交付例外

用户明确要求把 #32 的剩余补证与 #33 人工补签／更正放入一个新的 PR，并授权提交、push、创建 Draft PR 和对齐这两项的 Project 状态；不授权合并。本次以 #33 为主要实现 Issue，附带 #32 补证，分支为 `codex/33-manual-attendance`，base 仍是 `sprint/7-qr-check-in-dinner`。此明确要求覆盖本文关于顺序 Issue 必须各自独立 PR、等待他人手动更新状态后才能开工的安排，不改变其他成员的文件所有权、独立审查或 Sprint 最终验收要求。

#32 已有批准并合入 Sprint 的 [PR #88](https://github.com/Josscui516/MahjongFlow/pull/88)，新分支从最新 Sprint 基线创建，并迁入 [PR #89](https://github.com/Josscui516/MahjongFlow/pull/89) 的两文件补证。#89 暂不关闭；新 PR 集中审查相同补证及 #33，不应把两份重复补证分别合并。Acceptance Gate 保持未通过，两项 Issue 均不提前关闭或标记 Done。

状态对齐已尝试：目标为 #32 `Testing`、#33 实施时 `In Progress`／可审查时 `Review`；GitHub API 因当前授权只有 `read:project`、缺少 `project` 写 scope 拒绝，实际状态仍为 `Backlog`。这是看板同步权限问题，不再阻止本次已获批准的实现。Shiying 补充 `project` 授权后重试并读取确认；下一次检查为本次 PR 交付前或最迟 2026-09-29 16:30 AEST。未改变 Sprint、负责人或验收门禁。

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

### 2026-09-28 首次交接核对（实施 #33 前的历史快照）

本节区分已经集成的个人交付、本次独立补证和仍未完成的跨包验收，不作为 Sprint 7 完成证明。唯一交接对象仍为 Joshua。

| 项目 | 实际证据 | 当时结论 |
|---|---|---|
| #32 审计读取与显示 | [PR #88](https://github.com/Josscui516/MahjongFlow/pull/88)，实现 `33fe42a4eb35b3cebb78d0ea70e850bdd29aed65`，合并提交 `dcdbcdb571bd0b201e8251c552843ea48964838e` | 已合入 `sprint/7-qr-check-in-dinner`；不是合入 `main` 或最终 Done |
| 非作者审查 | Caiqwe123 于 2026-09-28 13:41 AEST 批准该实现；审查明确保留真实联调、路由和视觉验收 | 独立读取工作包无阻塞发现；不将代理自查当作团队批准 |
| PR 质量检查 | [Quality 运行记录](https://github.com/Josscui516/MahjongFlow/actions/runs/36373796006)：Lint、Typecheck、Test、Database、Build 均通过；Supabase Preview 跳过 | 对应 PR #88 的实现提交，不覆盖之后的本地补证 |
| Project 实时状态 | [MahjongFlow MVP](https://github.com/users/Josscui516/projects/5) 中 #32、#33 均为 Sprint 7／Backlog／Acceptance Gate Incomplete | 与 #32 的审查、合并证据未同步；未自行修改状态或关闭 Issue |
| #33 人工补签与更正 | [Issue #33](https://github.com/Josscui516/MahjongFlow/issues/33) 尚未交付；认证依赖 #10 已关闭 | 按本计划等 #32 进入 Testing 后再开始，不在已合并的 #32 分支上继续交付 #33 |

核对时远程 Sprint 7 为 `2c29a1bfe8762ba288fe162b435852e7017bcba1`，已包含 #30／PR #85 和 #32／PR #88。#31／[PR #86](https://github.com/Josscui516/MahjongFlow/pull/86) 仍为未合并 Draft；#34 尚无已集成页面；#35／[PR #87](https://github.com/Josscui516/MahjongFlow/pull/87) 仍为未合并 Draft。以上为本次核对快照，后续开始实施前必须再读实时状态。

### 可直接消费的 #32 输出

- 服务端公共入口：`@/features/attendance/records/server` 的 `attendanceAuditService.listForEvent(eventId)`；必须使用当前 authorised 会话，不向消费者暴露内部 repository 或通用特权 client。
- 显示入口：`@/features/attendance/records` 的 `AttendanceAuditList`、`AttendanceAuditLoading`。Li 在 #34 挂载页面和保护路由；Shiying 不跨目录代写。
- DTO：活动与最小参与者身份、confirmed／voided、QR／manual、签到时间、更新时间和必要操作者显示名；不包含学号或操作者 profile ID。
- 既有 schema、约束、RLS、可信操作者和时间触发器复用；#32 未新增 migration、生成类型、seed 或生产写入入口。回退应用读取组件不删除签到历史；消费者已接入时应先协调导入关系。

### 首次本地补证（原实现基线）

首次补证时复验目录为 `tmp/MahjongFlow-issue32`，应用代码为 `33fe42a`，没有将未合并的其他工作包混入本地实现。以下为迁移到最新 Sprint 7 之前的历史证据，不代表后续基线的完整验收。

| 命令／检查 | 本次结果 |
|---|---|
| `npx vitest run src/features/attendance/records` | 28 项通过 |
| `npm run lint` | 通过 |
| `npm run typecheck` | 通过 |
| `npm test` | 649 项通过、3 项既有跳过；5 项脚本测试通过 |
| `npm run db:test` | 14 个 SQL 文件、392 条断言全部通过，包含本次新增文件 |
| `npx supabase test db supabase/tests/rls/issue-32-qr-provider-audit.sql --local` | 新增 20 条断言单独复跑全部通过 |
| `git diff --check`、个人计划 Markdown 相对链接检查 | 通过；3 个相对链接均可解析 |

新增 [真实 QR RPC 审计回归测试](../../../supabase/tests/rls/issue-32-qr-provider-audit.sql) 直接调用既有 `public.submit_event_check_in`，再以 authorised 身份读取审计投影，覆盖可信签到时间、QR 空操作者、活动隔离、重复提交整行不变、void 更正的操作者／更新时间及 QR 重试不恢复。committee、无有效 profile 和匿名读取均拒绝。它验证数据库真实写入与审计合同，不验证 #31 新 HTTP／页面或 #33 尚未实现的人工表单。

首次测试在本地 Docker 数据库执行，migration 基线截至 `20260908232400`，未应用远程后续工作包或重置数据库；新增 fixture 仅在事务内使用，结束后检查虚构用户、活动和参与者均未遗留。无 schema／RLS／生成类型／生产配置变化，故没有新 migration 或类型生成步骤。首次仅增加测试和交接文档，没有重跑应用构建；原实现的生产构建证据见 #88 Quality。

### 授权发布复验（最新 Sprint 7 基线）

用户已明确授权新分支、提交、push 和 Draft PR，不授权合并。本补证使用 `codex/32-qr-audit-evidence`，从 `sprint/7-qr-check-in-dinner` 的 `2c29a1bfe8762ba288fe162b435852e7017bcba1` 建立；只纳入本个人文档和新增 SQL，不复用已合并的 #88。提交 SHA、Draft PR 和新 CI 结果以关联补证成员 PR 为准；本次补证仍需独立的非作者审查，代理复核与 #88 的批准均不替代该审查。

| 命令／检查 | 最新基线复验结果 |
|---|---|
| `npm ci --no-audit --no-fund` | 按已提交 lockfile 安装依赖；未修改依赖文件 |
| `npm run lint` | 通过 |
| `npm run typecheck` | 通过 |
| `npm test` | 656 项通过、3 项既有跳过；5 项脚本测试通过 |
| `npm run build -- --webpack` | 通过，含 TypeScript、16 页预渲染和构建追踪；本次未运行默认 Turbopack 构建 |
| `npx supabase test db supabase/tests/rls/issue-32-qr-provider-audit.sql --local` | 新增 20 条断言再次通过，使用本地既有 migration 基线 |
| `npx supabase test db /private/tmp/mahjongflow-issue32-delivery.Sufe6N/latest-baseline-audit.sql --local` | 在同一回滚事务内临时加载已合并 #30 migration 后，新测试 20 条断言通过；未持久应用该 migration |

最新基线兼容性复验的临时 SQL 由一个 `begin;`、仓库原样的 `20260916000100_secure_event_check_in_token_management.sql` 和新增测试（去掉其开头重复的 `begin;`、保留末尾 `rollback;`）组成。可用相同顺序在临时文件中重建并通过仓库 Supabase CLI 复验；不在共享数据库执行 reset 或远程 migration。结束后只读核对新管理函数和虚构活动均未遗留。临时文件不纳入提交。

没有在最新基线上声称完整 SQL suite、迁移重放或 #31 HTTP／页面验收通过：14 文件／392 断言属于上节原 migration 基线；最新基线的全量迁移与 SQL 回归由新 PR CI 及 Sprint 集成验证。此次改动不改变运行时、UI、数据库 schema、RLS、seed、生成类型或生产配置。

### 剩余工作、责任与开始条件

| 未完成项／影响 | 已核对或尝试 | 所需帮助／责任人 | 下一步与复查时间 |
|---|---|---|---|
| #32/#33 Project 状态尚未同步（原开工阻断已解除） | 用户已批准合并交付及状态对齐；API 写入因缺少 `project` scope 拒绝 | Shiying 补充 GitHub 授权后重试；不等待 Joshua 代改 | 本次交付前复查，最迟 2026-09-29 16:30 AEST |
| #31 HTTP／页面到 #32 审计的真实链路尚未验收 | #86 未合并；既有数据库 RPC 可以独立验证，但不能代替新 HTTP 边界 | Xuanwei 完成 #31；Shiying 复验审计输出；Joshua 协调 | provider 集成后切换真实入口复验；同上复查时间 |
| #34 挂载、路由权限、桌面／手机／键盘证据未完成 | 当前 Sprint 尚无签到后台页面，静态渲染测试不能代表整页验收 | Li 负责路由和界面集成；Shiying 配合核对审计组件 | 页面交接后执行三角色与视觉检查；同上复查时间 |
| #35 真实 read port 消费与 Sprint 最终验收 | #87 尚未合并，未宣称晚餐链路完成 | Yubo 负责消费端；Joshua 负责跨包验收、总 PR 和 Project | 按冻结公共入口接入；同上复查时间 |

上述未完成项于本次 2026-09-28 核对记录；#31 依赖已在 #88 正文提前记录。没有设置自动监控，也没有未经授权发送 Issue 评论或请求合并。以下新增交付节记录 #33 本次实现和实际验证，不能把上面的 #32 历史通过结果替代 #33 验收。

## 11. #33 人工操作与 #32 补证的合并交付

### 实现与消费者接入

本次新增 `src/features/attendance/manual/`，不修改 Li 的路由、Xuanwei 的匿名入口或 Yubo 的晚餐模块。

- 不可变合同与纯校验：`contracts.ts`、`validation.ts`。逐字段使用 `FormData.getAll` 拒绝重复值和 File；检查活动／记录 UUID、现有参与者邮箱、确认、状态和真实日历日期，保留数据库时间的微秒精度。
- 服务与副作用边界：`service.ts` 先 `requireAuthorised` 再校验／查询；`repository.ts` 只使用当前用户 JWT client。补签按精确规范化邮箱查找既有参与者，不创建参与者或报名；更正只更新状态，以活动、记录、原状态和原 `updated_at` 一次性条件 UPDATE 防止丢失更新。
- 可信审计：INSERT 只写 `event_id`、`participant_id`；UPDATE 只写 `attendance_status`。操作者、人工方式、签到时间和更新时间由既有数据库列授权、默认值和触发器控制；QR 原始方式／签到时间不会被人工更正覆盖。
- UI：确认内容随参与者、操作或版本变化失效；pending 使用同步锁和禁用控件；每次返回结果重新聚焦摘要；成功／重复／版本冲突不允许重用旧操作；临时事务失败保持可重新确认后重试，未自动重试数据库写入。
- 公共 Server Component：从 `@/features/attendance/manual` 导入 `ManualAttendancePanel`、`ManualAttendanceLoading`。Li 在自己的 authorised 路由挂载 `<ManualAttendancePanel eventId={eventId} />`，可用 Suspense 的 fallback 显示 Loading。组件通过 #32 公共 read port 自行校验授权，拒绝时不向 client 提供记录。
- 公共服务端入口：`@/features/attendance/manual/server` 导出 `manualAttendanceService.submit(eventId, formData)` 和 `submitManualAttendance(eventId, previousState, formData)`。后者忽略浏览器传来的旧结果；成功的最小结果为 `{ status: "success", eventId, updatedAt }`。缓存刷新失败附加 `refreshRequired: true`，不把已经提交的写入误报失败。
- Li/Yubo 成功后按 `eventId` 重新读取当前事实；本包不写晚餐资格，也不导入消费者内部模块。已连接表单在成功或冲突后刷新当前路由输入，组件交互测试使用隔离的 action／router 边界。

### 本次验收证据

| 场景 | 本包证据与结果 |
|---|---|
| K-05 #32 补证 | 保留真实 QR RPC 到 authorised 审计投影的 20 条 SQL 回归；没有以手工 QR fixture 代替全部真实 provider 证据 |
| K-06 创建／void／恢复 | 服务／适配器／action 测试及新增 27 条 SQL，验证当前操作者、数据库时间、原始 QR 元数据和未报名人工例外 |
| K-04 QR/manual 并发 | 专属双连接脚本确认第二事务真实锁等待后才释放第一事务；分别验证 QR 胜出、manual 胜出均一行且不覆盖审计 |
| 并发更正与失败零变更 | 两位操作者并发同版本更新只成功一次；新版本可由第二人恢复；旧版本、非法字段、越权操作不改原行 |
| 权限／隐私 | authorised 允许；committee、无有效 profile、匿名／参与者拒绝；服务先鉴权、RLS 和列授权双重防线；只使用虚构数据 |
| 组件反馈 | loading、empty、validation、permission、unauthenticated、duplicate、conflict、system error、success 及 pending 均实现；真实浏览器测试另见交付 PR 的执行记录 |

| 命令／检查 | 结果 |
|---|---|
| `npm run lint`、`npm run typecheck` | 通过 |
| `npx vitest run src/features/attendance/manual` | 6 个文件、109 项通过，含事务回滚后同一表单可重新确认重试的回归 |
| `npm test` | 765 项通过、3 项既有跳过；另有 5 项脚本测试通过 |
| `env ISSUE33_PLAYWRIGHT_MODULE=/Users/syscarlet/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright ISSUE33_EVIDENCE_DIR=/private/tmp/mahjongflow-issue32-delivery.Sufe6N/issue33-ui node tests/integration/attendance/manual/browser.mjs` | Chrome 中 14 项真实组件交互通过；桌面／390px 窄屏截图已生成并检查，无横向溢出 |
| `npm run build -- --webpack` | 通过；没有把尚未挂载的 #34 路由列为已验收 |
| `npx supabase test db supabase/tests/rls/issue-33-manual-attendance.sql --local` | 27 条通过；本地已持久应用 migration 截至 `20260908232400` |
| `node tests/integration/attendance/manual/database-concurrency.mjs` | 4 类真实竞争／更正场景通过，精确清理本脚本随机 UUID 的虚构 fixture |
| `node /private/tmp/mahjongflow-issue33-suite.f4o24r/run.mjs` | 16 个 SQL 文件、438 条断言通过；逐文件临时加载最新 #30 migration 后运行并回滚 |

最新结构全量 SQL 复验使用临时包装器：每份原 SQL 保持断言不变，仅在首个 `begin;` 后插入原样 `20260916000100_secure_event_check_in_token_management.sql`，保留末尾 `rollback;`。首次临时包装器的 JavaScript 替换字符串错误处理了 SQL dollar quote，测试未进入断言；改为函数式替换后重新生成并运行全部 438 条通过。仓库 migration／测试原文件没有为此改写，结束后核对新增管理函数和 #33 固定 fixture 均未遗留。在已经应用完整 Sprint migration 的独立开发／CI 环境直接运行 `npm run db:test` 即可；本次没有对共享库 reset、持久迁移或声称全量从空库重放已完成。

### 数据库、回退与剩余交接

本次没有 schema、RLS、索引、函数、seed 或生成类型变化，因此不新增空 migration，也不手工修改 Li 持有的生成类型。复用 `(event_id, participant_id)` 唯一约束、状态与条件操作者约束及可信审计触发器。回退只撤下人工组件并回退本次应用提交，保留全部历史签到行；禁止通过删除签到纠错。若消费者已接入，先协调移除导入，再回退提供者。

浏览器 runner 使用已有 Vite 与外部 Playwright runtime，不改共享依赖或 CI；其他开发机可将 `ISSUE33_PLAYWRIGHT_MODULE` 指向本机 Playwright 模块，`ISSUE33_BROWSER_CHANNEL` 默认 `chrome`。截图位于上表 evidence 目录的 `manual-attendance-desktop.png`、`manual-attendance-mobile.png`，按仓库约定不提交运行产物。

功能自身实现和验证不等于 Sprint Done。仍需 Joshua 的团队非作者审查、Li 的 #34 路由挂载／权限与完整页面视觉验收、#31 HTTP 真实链路及 Yubo 消费后重算的集成验证。浏览器证据是实际 React 组件在虚构数据、注入 action／router、真实 `globals.css` 和隔离容器下的交互测试，**不是**正式路由或晚餐全链路验收。新 Draft PR 不合并，不关闭 #32/#33，不把 Acceptance Gate 改为 Passed。
