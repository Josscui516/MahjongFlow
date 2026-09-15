# 课程第 8 周（开发第 7 周）：QR 签到与晚餐核验

> 依据[《MVP 项目企划书》](../../project/MVP_PROJECT_PROPOSAL.md)第 9 节及[统一周计划模板](../../templates/WEEK_IMPLEMENTATION_PLAN_TEMPLATE.md)。Li、Xuanwei、Shiying、Yubo 负责功能实现和功能自测；Joshua 负责集成、共享验收与交付。本文是执行计划，不是 M4 完成证明。

## 1. 本周目标

形成“活动 → 报名 → QR／人工签到 → 晚餐核验”真实闭环，达到 M4：活动运营端到端流程完成。普通委员会只能查看安全人数，授权人员能查看签到明细、补签、更正和核验晚餐；活动参与者只能完成当前受限签到。

### Sprint 交付路线

- GitHub Sprint：`Sprint 7`；集成分支：`sprint/7-qr-check-in-dinner`，从最新 `origin/main` 创建。
- 集成负责人及远程分支／Project 手动维护负责人：Joshua（`Josscui516`）。
- Sprint 总 PR 主要 Issue：[#7](https://github.com/Josscui516/MahjongFlow/issues/7)。
- 其余纳入 Issues：#8、#30、#31、#32、#33、#34、#35、#36、#37；完整集合恰为这 10 项。
- #8 由 Joshua 汇总晚餐验收，不新增第二个 Sprint 总 PR；唯一总 PR 为 `sprint/7-qr-check-in-dinner` → `main`。
- 成员 PR 均以本 Sprint 分支为 base，每个 PR 只关联一个主要 Issue。成员合入后保持 `Testing`，总 PR 合入 `main` 且全部门禁通过后才判断 Done／关闭。
- 本次用户授权创建分支、提交并推送计划及手动设置上述项目项的 Sprint／负责人；后续功能实现、PR、合并和状态迁移依各自授权与门禁执行。

### 成员独立工作文档

- [Li：QR 入口管理与授权签到视图](LI_WEEKLY_WORK_PLAN.md)
- [Xuanwei：匿名签到与原子去重](XUANWEI_WEEKLY_WORK_PLAN.md)
- [Shiying：签到审计与人工更正](SHIYING_WEEKLY_WORK_PLAN.md)
- [Yubo：晚餐资格与核验页面](YUBO_WEEKLY_WORK_PLAN.md)
- [Joshua：M4 集成与验收](JOSHUA_WEEKLY_WORK_PLAN.md)

## 2. 上周输入与开始条件

- 2026-09-16 实时核对：Sprint 6 总 PR #84 已合入 `main`，基线为 `b7da5e7a197f3dd2357b7eba53a6293b7d5ef4e4`；本地起始工作区干净。#5/#17/#26/#27/#28 在 Project 为 Done、Acceptance Gate 为 Passed。
- 输入来自[开发第 6 周计划](../week-6/WEEK_6_IMPLEMENTATION_PLAN.md)：真实活动、参与者身份匹配、报名取消／恢复、安全聚合和受保护后台。开始实现时复验实际代码及迁移，不依赖 README 中较早的阶段摘要。
- 当前生成类型已有 `attendance_records`、`event_check_in_tokens`、活动窗口字段。先做差异核对，再补缺失事务／函数／约束，不重复创建已有表，不手工补生成类型。
- 本次读取 10 项均为 Backlog、未分配 Sprint／负责人；功能项 Gate 为 Incomplete，两个 Epic 为 Not checked。规划分配不代表开始实现，不自动改变 Status 或 Acceptance Gate。
- #7 的 Epic Dependencies 包含跨周 #6；#6 的 #29 清理工具属于开发第 8 周。按企划书顺序以已验收 #26/#27/#28 为本周报名功能输入，记录 #6 尚未整体收口，不要求提前关闭 #6、不把 #29 移入 Sprint 7。若具体签到所需输入仍缺失，必须阻断相关集成。
- 每人启动前核对当前 WIP、主要 Issue、实际 base/head、文件交接和依赖；前置实现未到位时只以冻结合同／虚构 fixture 推进可独立部分，不能以 mock 代替真实验收。
- 必读[验收矩阵](../week-1/artifacts/day-1/DAY_1_P0_ACCEPTANCE_MATRIX.md)、[数据约束](../week-1/artifacts/day-3/DAY_3_STEP_4_CONSTRAINTS_STATES_AND_DERIVED_RULES.md)、[权限矩阵](../week-1/artifacts/day-3/DAY_3_STEP_5_PERMISSION_MATRIX_AND_CONTROL_POINTS.md)、[迁移规范](../../operations/DATABASE_MIGRATIONS.md)和[Git 协作约定](../week-1/artifacts/day-1/DAY_1_GIT_COLLABORATION_AGREEMENT.md)。Next.js 编码前读取安装版本文档；库/API 查询按 Context7 规则执行。

## 3. 本周范围

### 3.1 必须完成

- `CHECKIN-01`–`CHECKIN-07`：专属 token／URL／QR、有效窗口、受限匹配与签到、并发唯一性、审计、人工补签／更正、授权明细与安全统计。
- `DINNER-01`–`DINNER-04`：只读资格推导、授权核验、签到更正后的即时重算；授权页展示当前活动资格汇总。
- K-01–K-08、D-01–D-04、适用 X-05 权限绕过测试；复验报名与签到分离，以及既有活动／任务／Dashboard。
- 四位作者各自交付单元、服务／路由、数据库及回归证据；Joshua 交付跨包真实流程、权限、迁移、回滚及 M4 验收。

### 3.2 条件允许时完成

现场窄屏、键盘操作和错误文案的小幅改善，前提是不挤占 P0、权限和并发测试。

### 3.3 明确不做

不增加公开自助报名、扫码登录、设备摄像头扫码器、离线签到、动态防转发 QR、支付、餐券发放记录、可编辑资格、CSV 导出或通知；#29 清理工具及全项目内部验收留给开发第 8 周。本周截图、种子和测试只用虚构／匿名数据。

## 4. 五个独立工作包

| 成员／账号 | 工作包与顺序 Issues | 主要所有权 | 固定输入 | 输出与个人验收 | 工作量 |
|---|---|---|---|---|---|
| Li / `Kaia-Zhang` | A：#30 → #34 | attendance/tokens、views、aggregation；活动详情挂载；签到页面 | 活动、授权身份；Shiying 审计 DTO | token 管理／窗口／QR；授权明细与聚合；K-01/03/07/08 | 10 点，含共享类型生成协调 |
| Xuanwei / `YUHAN2233` | B：#31 | attendance/self-check-in；公开 check-in 页面/API | Li token 验证合同、既有参与者／报名约束 | 最小表单、限速、原子签到和去重；K-02/03/04/08 | 8 点 |
| Shiying / `Scarletthekiller` | C：#32 → #33 | attendance/records、manual | 既有签到 schema、Xuanwei QR 写入输出 | 审计 DTO／显示组件、人工补签／void／恢复；K-04/05/06 | 8 点 |
| Yubo / `Caiqwe123` | D：#35 → #36 → #37 | dinner-verification 及其路由 | Shiying 当前签到 read port／更正结果 | 资格纯函数、授权核验页、重算和汇总；D-01–D-04 | 11 点 |
| Joshua / `Josscui516` | E：#7 主集成，#8 晚餐验收汇总 | tests/acceptance/check-in-dinner、共享 fixture／CI、week-7 证据 | 四个自测工作包 | 全链路真实验收、独立 review、M4 交接 | 约 9 点，仅集成验收 |

功能点数沿用现有 Issues，不把 Epic 聚合点数重复计入个人工作量。Yubo 的 #35 是纯推导、#37 复用 #33 成功结果；Li 复用已有安全人数组件。若负载超出当周容量，由 Joshua 调整交付顺序与风险记录，不代写功能或移交作者最低测试。

### PR 路线与集成顺序

| 顺序／依赖 | 负责人与 Issue 分支 | PR base | 进入集成分支条件 |
|---|---|---|---|
| 1 | Li：`codex/30-event-check-in-token` | `sprint/7-qr-check-in-dinner` | K-01/03、token 安全及窗口边界通过 |
| 2，依赖 #30/#26/#10 | Xuanwei：`codex/31-atomic-self-check-in` | 同上 | K-02/03/04/08、真实并发与匿名拒绝通过 |
| 3，依赖 #31 | Shiying：`codex/32-attendance-audit` | 同上 | K-05、条件审计字段、授权 DTO 通过 |
| 4，依赖 #32/#10 | Shiying：`codex/33-manual-attendance`；Li：`codex/34-attendance-views` | 同上 | 各自 K-06 或 K-07/08，以及 QR／manual 竞争测试通过 |
| 4，依赖 #32 | Yubo：`codex/35-dinner-eligibility` | 同上 | D-01/02、错误活动／voided／缺失记录通过 |
| 5，依赖 #35/#10 | Yubo：`codex/36-dinner-verification` | 同上 | D-03、授权核验与最小响应通过 |
| 6，依赖 #35/#33 | Yubo：`codex/37-dinner-refresh` | 同上 | D-04、失败／并发／陈旧视图通过 |
| 7 | Joshua：`codex/7-check-in-dinner-acceptance` | 同上 | 完整 K/D、权限、迁移、回滚、回归与证据 |

每个成员 PR 都需作者自查、功能测试、非作者批准、必需 checks；同一成员前一个主要 Issue 进入 Testing 后再启动下一项。Joshua 的 #7 是唯一主要 In Progress，#8 先收集证据，待 #7 进入 Review／Testing 后再顺序完成 #8 验收记录；如需改文件使用 `codex/8-dinner-acceptance`，仍以 Sprint 分支为 base。功能 PR 由 Joshua 集中审查；Joshua 的验收 PR 与总 PR 由 Li 主审、Shiying 复核权限。上周一次性审查豁免不延续到本周。

## 5. 固定接口与文件边界

以下为周初需核对冻结的实现合同；未出现于仓库的目录／函数是计划交付，不是现有 API。

| 合同 | 提供者 → 消费者 | 必须保持的行为 |
|---|---|---|
| token/context | Li → Xuanwei | token 绑定唯一活动；至少 32 随机字节，仅存 SHA-256 摘要；一次性显示 URL，轮换撤销旧值；服务端窄操作返回最小活动信息与统一不可用结果，无参与者信息 |
| 窗口／事务验证 | Li → Xuanwei | `opens_at <= now < closes_at`，DB 权威时钟；活动须 scheduled；公开提交的同一事务再次校验 token/撤销/窗口/报名，不信任页面此前成功的 context |
| 公开提交 | Xuanwei → 页面／Joshua | 输入 token、email、条件 studentId；活动由 token 推导；结果仅 success／already_processed／统一失败；不返回个人标识、资格、名单；不新建参与者或报名 |
| Attendance read port | Shiying → Li、Yubo | 用户 JWT + authorised；显式 eventId 范围；最小 participant 身份、confirmed/voided、checkedInAt、method、recordedBy、updatedAt；只从 provider 公共入口使用，不导入内部 repository |
| 人工动作组件 | Shiying → Li | ManualAttendancePanel(eventId) 与审计显示组件；补签／void／恢复；失败不改行；成功返回 eventId、更新版本／时间的最小结果，客户端不得伪造操作者 |
| 安全统计 | Li → 活动详情 | 复用 `get_event_participation_totals`；仅 eventId、registrationCount、attendanceCount；只统计 registered／confirmed，不给 committee 晚餐个人数据 |
| 晚餐推导／刷新 | Yubo → 授权页 | 当前活动 confirmed 才 Eligible；缺失／voided／错活动为 Not Eligible Yet；不设资格表／列／写接口；下一次读取重查 DB，失败更正不改变原结果 |

### 路由及共享文件唯一所有权

- Li 独占 `src/features/attendance/tokens/`、`views/`、`aggregation/`；`src/app/(dashboard)/attendance/` 页面、layout、loading/error；`src/app/(dashboard)/events/[eventId]/page.tsx` 及其导航测试中的 token／签到／晚餐挂载；`src/features/registrations/attendance-summary/` 的本周聚合接入。保持已有报名、筹备和活动编辑行为。
- Xuanwei 独占 `src/features/attendance/self-check-in/`、`src/app/check-in/[token]/`、`src/app/api/check-in/[token]/`，包括公开入口限速及输入上限。token context 调用 Li 的服务端公开 port；不暴露通用 secret client。
- Shiying 独占 `src/features/attendance/records/`、`manual/` 及其功能测试。#32 提供独立可渲染审计组件、read port；#33 提供人工操作组件，Li 负责挂载到签到页，避免双方编辑同一路由。
- Yubo 独占 `src/features/dinner-verification/` 和 `src/app/(dashboard)/dinner-verification/`。更正后的重新查询与陈旧视图处理在该目录实现；不改 Shiying action。确需失效通知时先由 provider 修订公共成功合同，不能跨目录导入晚餐模块形成反向依赖。
- 共享认证不新增第二套：Li 持有本周 `src/proxy.ts`、`src/lib/auth/redirect.ts` 的必要窄改动及相应 guard 测试，覆盖既定后台 namespace；各功能作者仍负责每个服务端入口的角色检查。公开 `/check-in` 不能被改成后台登录页面。没有已证明缺口则不修改这些文件。
- Li 负责唯一 QR 依赖选择与 `package.json`／`package-lock.json` 变更；Xuanwei 如需限速依赖先提交需求交 Li，优先满足部署多实例下的有效限制，不能用仅进程内计数假称生产限速。
- 功能作者各自创建 Issue 专属 timestamp migration 和数据库测试，禁止多人修改同一 SQL；共享 SQL 对象按 #30 → #31 → #32 → #33 → #34 → #35 → #36 → #37 接力，后项不得改历史文件。无 DB 差异的 Issue 写明不适用。
- `src/types/database.generated.ts` 与 `docs/operations/DATABASE_MIGRATIONS.md` 本周归 Li：各作者提交 SQL／回退说明，Li 在其 PR 交接窗口用工具生成类型并补文档，完成后返还作者验证。其他人不并行写共享文件。Joshua 只验证重放／生成一致性。
- Joshua 独占 `tests/acceptance/check-in-dinner/`、`tests/fixtures/check-in-dinner/`、共享 CI／测试配置、`supabase/seed.sql` 和本周集成证据；功能作者用同目录局部测试和 `issue-30` 至 `issue-37` 专属虚构 fixture／SQL 测试。共享配置变更不承接功能开发。
- 每名成员仅编辑自己的个人计划；Joshua 维护统一计划、README 计划入口、验收记录与 RTM。未列出的文件默认保持原样；跨周文件先确认交接，接口变化由所有者记录原因、影响、消费者及复验方法，经 Joshua 协调后落实。

## 6. 三个团队检查点

1. **周初合同冻结**：核对 main、10 项 Sprint 成员／账号／WIP、既有 schema、路由所有权、token 验证和 DTO；给消费者虚构样例，未满足真实依赖的部分不提前验收。
2. **工作包完成后的单次集成**：在一个集中集成窗口按第 4 节依赖顺序接入 PR；切换真实 provider，验证迁移顺序及组合行为，功能缺陷由对应作者修复。顺序 Issue 交付不要求每日全员同步。
3. **周末验收**：Joshua 完成 K/D 与回归，Li／Shiying 独立审查验收和总 PR；核对 Project 成员精确集合。所有必需门禁通过且另行授权合并 main 后，Joshua 再逐项判断 Done 与关闭。

## 7. 本周交付物

- 八个功能 Issues 的实现、自测、SQL／回退说明、公共合同和成员 PR。
- 五份个人计划；Joshua 后续创建 `QR_CHECK_IN_DINNER_ACCEPTANCE_RECORD.md`，记录逐场景 SHA、命令、结果、三角色证据、失败归属与复验；规划阶段不创建假通过记录。
- 可使用虚构报名扫描打开的 QR 演示，授权补签／更正、实时晚餐核验、安全人数和手机布局证据。
- M4 交接包与开发第 8 周内部验收输入；#29 保留独立范围与后周责任，不提前实施清理。

## 8. 本周验收清单

- [ ] K-01：实际解码 QR，URL 仅指向正确活动受限页面；明文仅一次显示、轮换／撤销有效。
- [ ] K-02/03：有效报名首次成功；未开窗、恰好开窗、恰好关窗、过期、撤销、错误活动、取消活动、无报名、条件学号不匹配均按合同处理；包含 Sydney 夏令时边界。
- [ ] K-04：顺序重复、QR/QR 与 QR/manual 并发最终一行；QR 不恢复 voided，不改已有审计字段；原子写入失败回滚。
- [ ] K-05/06：QR／manual 元数据、当前操作者及更新时间正确；人工可处理未报名现场例外，不隐式新增报名；未授权／失败更正保留原记录。
- [ ] K-07/08、X-05：直接 URL、服务端入口及 DB 三层验证 authorised 允许，committee／匿名／无有效 profile 拒绝明细；普通人数响应仅数字和 eventId。
- [ ] D-01/02：当前 confirmed 为 Eligible；未签到、错活动或 voided 为 Not Eligible Yet；不增加个人属性或可写资格。
- [ ] D-03/04：资格与汇总仅 authorised 可读；人工更正后下一次读取重算；失败与并发不显示伪成功或持久化陈旧资格。
- [ ] 公开入口有限速、大小限制、统一非枚举错误；日志、响应和浏览器 bundle 无 secret、完整 token、身份字段或请求正文泄露。
- [ ] UI 覆盖 loading、empty、success、validation error、permission denied、duplicate submission、system error；不适用项逐条说明；桌面／手机／键盘路径可用。
- [ ] 功能测试与真实跨包验收通过；不得以 mock 或只有按钮隐藏作为权限与流程证据。
- [ ] 适用 `npm run lint`、`npm run typecheck`、`npm test`、`npm run test:acceptance`、`npm run db:test`、`npm run db:test:concurrency`、`npm run db:lint`、`npm run db:diff`、`npm run build` 通过。既有 concurrency 命令不自动覆盖新签到竞争，#31/#33 必须补并执行专属竞争测试，记录真实命令。
- [ ] 在隔离虚构本地数据库验证干净重放、从 Sprint 6 升级、生成类型一致性及回退；不在真实业务环境运行 reset。部署先 SQL、后应用；回退先停公开写入并撤销 token／函数访问，保留审计数据，按 migration 文档执行。
- [ ] 既有会议、任务、活动、报名和 Dashboard 无回归；非作者 review、必需 checks 与全部 review threads 通过。
- [ ] #7 + #8/#30–#37 与 Project Sprint 7 成员完全相同；没有提前 Done；总 PR 编辑成员集合后重新核对并取得新 review。

## 9. 风险与应对

| 风险 | 信号／影响 | 应对 | 所有者 |
|---|---|---|---|
| token 校验与写入分离 | 撤销或关窗后仍可写 | 同一事务重验；撤销／提交并发复验 | Li、Xuanwei |
| 连锁依赖拖延 | #31 未完成，后续只能 mock | 周初冻结既有 schema 与 port；真实验收按依赖收口，首次阻断即记录 | Joshua |
| 多人覆盖审计与类型 | 不同 PR 改相同 SQL／生成文件 | SQL 增量接力；Li 单一生成窗口 | Li、Shiying |
| 匿名身份枚举／日志泄露 | 差异错误或完整 URL 出现在日志 | 统一响应、限速、禁记 token／个人字段，阻止合并 | Xuanwei |
| 晚餐显示旧结果 | correction 成功后仍使用旧缓存 | 下一次 read 查询当前 DB；失败保持原值，陈旧视图提示刷新 | Yubo |
| 四人负载不均 | Yubo 末尾 #37 无法验收 | 提前用冻结结果 fixture 做 UI，先保证规则／权限；风险当日升级 | Yubo、Joshua |

## 10. 本周完成定义

K-01–K-08、D-01–D-04 和适用权限／回归／迁移检查有真实通过证据，四个功能包与集成包均完成独立审查，阻断缺陷为零；真实链路达到 M4。总 PR 合入 main 且必要环境复验后，才由 Joshua 手动确认本 Sprint 十项 Done／关闭。#6 不随本周关闭；开发第 8 周全项目验收不替代本周最低测试。

## 11. 未完成项处理

首次发现即由责任人记录原因、影响、已尝试动作、所需帮助、负责人、Sydney 开始时间及下次检查时间；默认下一工作日同一时间复查，超过一个工作日升级。当前 PR 引入且属于其合同的缺陷由作者修复；其他工作包缺陷退回所有者，安全／数据完整性／集成阻断未解决不得合并。非阻断项记录负责人和期限，未经授权不另建 Issue 或变更状态。新需求进入 Post-MVP，不替代未完成 P0。课程周不按当前系统日期擅自换算。
