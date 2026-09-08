# Joshua Xingjian Cui：课程第 7 周（开发第 6 周）集成与验收计划

所属统一周计划：[开发第 6 周](WEEK_6_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Li](LI_WEEKLY_WORK_PLAN.md)、[Xuanwei](XUANWEI_WEEKLY_WORK_PLAN.md)、[Shiying](SHIYING_WEEKLY_WORK_PLAN.md)、[Yubo](YUBO_WEEKLY_WORK_PLAN.md)。四份均直接向本工作包提供交付物。

> 依据[成员模板](../../templates/MEMBER_WEEKLY_WORK_PLAN_TEMPLATE.md)。Joshua 不承担功能实现，也不替作者补最低单元/集成/路由测试；共享跨包验收由本人承担。

### Sprint 交付路线

- Sprint：`Sprint 6`；集成分支：`sprint/6-events-registration`。
- 唯一主要 Issue 及总 PR 主要 Issue：#5；验收分支：`codex/5-events-registration-acceptance`。
- 验收成员 PR base：`sprint/6-events-registration`；唯一 Sprint 总 PR：该 Sprint 分支 → main。
- 功能 Issues：#17、#18、#19、#26、#27、#28；总 PR 的完整 Issue 集合必须为 #5、#17、#18、#19、#26、#27、#28，并与实时 Project 一致。
- 账号：`Josscui516`；唯一最终交接对象：Li（非作者审查/验收接收），最终部署和交付仍由 Joshua 按权限管理。
- 本次只编制 Sprint 6 计划；届时再核对 Project、最新 main 和对应操作授权，不能把候选分配当作已执行。
- #6 为跨周报名 Epic，尚包含开发第 8 周的 #29；不加入 Sprint 6 可关闭集合。本人只收集 #26/#27/#28 已交付证据，保持 #6 未完成，不启动第二个主要 Issue。

## 1. 独立目标

接收四名功能开发者的自测交付物，验证真实跨包流程、权限、隐私、数据关系、回归和质量门禁，形成能够由非作者复验的 Sprint 总 PR 证据。完成真实活动→筹备任务及授权参与者→报名流程，补齐前周真实活动验收并交给开发第 7 周。

## 2. 工作包与文件所有权

- 允许修改：`tests/acceptance/events-registration/`、`tests/fixtures/events-registration/`、确需修改的共享测试配置、package 测试脚本/CI、`docs/plans/week-6/` 执行证据及 RTM 中本周实际验收记录。
- 禁止修改：四个功能所有者的业务代码、页面和局部最低测试，不重写来源转换、认证、参与者业务，也不手工修补数据库生成类型。
- 固定输入：四人公共合同、真实 adapter、虚构 fixture、各主要 Issue 的个人验收、PR/checks/review、迁移和回退说明。
- 输出合同：`EVENTS_REGISTRATION_ACCEPTANCE_RECORD.md`、跨工作包 harness、真实运行结果、review finding 归属与复验、Sprint 集成说明。
- 本人测试：跨包场景和共享 harness 的有效性；功能自身成功/失败/边界测试仍由功能作者负责。
- 共享数据库生成文件由 Li 按统一计划串行持有；本人负责重放/关系/权限/回滚验收，不与 Li 同时生成并提交。

## 3. 开始条件

1. 上一 Sprint 的 main 基线、真实 Issue、Project Sprint/负责人/Acceptance Gate 及 WIP 已读取；不能以旧 README 代替实时核对。
2. 周初先主持一次合同冻结，做只读风险/验收准备；四个功能工作包完成自测、独立 review 并进入 Testing 后开始完整 Sprint 收尾。
3. 当前 main 与 Sprint 基线可运行，验证环境只含虚构数据；缺少数据库或权限环境时记录真实阻断，不把无法执行记成成功。
4. 已收到每份 PR 的功能测试和已知风险；最低功能测试缺失必须退回作者，不能由本人代写后声称作者交付完整。
5. Sprint 5 合同交接与 main 合并已确认；七项 Sprint 6 成员由 Joshua 启动时人工核对，不把前周 #20/#21 或跨周 Epic #6 重复计为 Sprint 6 成员。

## 4. 独立执行步骤

### 步骤 1：确认五个工作包与验收基线

执行：读取统一周计划、四位成员文档与 #5、#17、#18、#19、#26、#27、#28 的当前描述/评论/标签/依赖/Project，同时只读核对 #6/#29 的跨周边界；冻结文件所有权、公共 DTO/port、fixture、角色矩阵及顺序。每人只一个主要 In Progress，分配不代表已经开始。

产出：集成顺序、场景映射、数据与环境前提、基线 SHA、待复验的历史限制。

检查：每个功能场景有唯一负责作者，测试平台与最低功能测试清楚区分；Project 成员无多项/漏项。

### 步骤 2：接收四个功能包并单次集成

执行：逐项检查个人测试、实际 base/head、主要 Issue 和 diff 所有权；在完成的交付物上集中非作者 review，按统一计划顺序合入 Sprint。切换消费者的 mock 为真实 provider，核对每个输出。

产出：成员 PR、review/checks、真实适配器集成记录；关联/进度/近期活动与报名的真实路由相连，报名不产生签到。

检查：成员合并须有明确授权；Issues 保持 Testing；任何接口不一致交还 provider，Joshua 不重写业务代码。

### 步骤 3：完整验收、回归与内部检查

范围：E-01–E-07、R-01–R-06/R-08、完整 T-05/T-06及任务来源回归；R-07 清理工具和后周签到/晚餐功能不冒充已完成。

执行：
1. 使用 committee、authorised、匿名/参与者三种测试上下文，检查直接 URL、服务端调用及 RLS，审阅响应和日志无密钥/个人资料泄露。
2. 跑真实数据库与真实应用 adapter 的跨包场景；虚构 fixture 可以准备数据，但不能用返回预设成功结果的 mock 代替功能验收。
3. 执行现有 `npm run lint`、`npm run typecheck`、`npm test`、`npm run test:acceptance`、`npm run db:test`、`npm run build`；运行报名并发测试、数据库 lint/diff，验证完整 migration 顺序、可重放、约束、RLS、生成类型及回滚。
4. 从真实创建两类活动开始，关联任务展示 2/3、更新活动不丢关系，报名首次/重复/并发/取消/恢复，验证无自动签到；替换 Dashboard 活动 adapter，补齐 T-05/T-06。
5. 记录每个失败的归属、负责 Issue/所有者、是否阻断成员 PR或总 PR、复验方法；安全/数据完整性/全局构建阻断先修复。

产出：`EVENTS_REGISTRATION_ACCEPTANCE_RECORD.md`、命令与 SHA、场景 Pass/Fail/Not run、风险和复验记录。

检查：未运行和未知均保留原样；只以证据判断通过，排期或文档存在不能代替验收。

### 步骤 4：非作者验收与 Sprint 总 PR 交接

执行：
1. 自查本人 harness/文档，按对应 Git 授权打开只关联 #5 的验收成员 PR，base 为 Sprint；由 Li 独立审查，Shiying 复核隐私证据。
2. 所有工作包 Testing 后再准备唯一 Sprint 总 PR，主要 Issue #5，其余完整集合按统一计划列出；实时核对 Project 成员，不能把 PR 正文当作成员事实源。
3. 总 PR 正文英文，含需求/场景、实际测试、权限/隐私、migration/RLS/生成类型、UI 状态、风险、回退和虚构截图。
4. 必需 checks、非作者批准、review threads 和逐项验收全部通过后，取得独立合并授权才能合到 main。
5. 合并后核对部署/文档/Issue，Joshua 按真实 Acceptance Gate 手动更新状态和关闭；已 Done 不重复更新，Done 但 open 才继续关闭，未通过的不关闭。

产出：可独立复验的 Sprint 总 PR 与交付包。检查：本人或 Codex 自查不视作非作者批准，没有自动维护 Project 的 workflow。

## 5. 低频沟通规则

只设置周初合同冻结、工作包完成后的单次集成、周末验收三个团队检查点。实现期间不要求持续结对或日常全员同步。只有接口改变、阻断和安全问题增加临时沟通。Joshua 负责分流和验收，不把所有缺陷直接接到自己名下。

## 6. 个人交付物

- 本周共享验收 harness/fixture 及真实适配器验证。
- `EVENTS_REGISTRATION_ACCEPTANCE_RECORD.md`、逐项测试/权限/迁移/回归和缺陷归属证据。
- 完整 T-05/T-06 补验与活动/参与者/报名合同，供下一周签到使用。
- 成员 PR/总 PR、非作者 review、checks、实际状态和未完成项清单。

## 7. 个人验收清单

- [ ] 四位成员自己完成其最低功能测试，且没有跨文件重写。
- [ ] 所有真实 adapter 集成并按本周场景验证。
- [ ] 三角色 URL/服务端/RLS、隐私/敏感数据/错误反馈均通过。
- [ ] 全部质量命令与适用数据库检查有真实结果，无未解释失败。
- [ ] 每个阻塞 finding 有负责 Issue/所有者与复验方式。
- [ ] 本人验收 PR 和 Sprint 总 PR 有非作者批准，不以自查代替。
- [ ] 完整 Issue 集合与实时 Project 相等，所有成员均达到真实 Testing。
- [ ] Sprint 5 遗留真实活动验收已在 #18/#19 落实并有完整证据。
- [ ] main 合并与必要环境验证完成后才判断七项 Sprint Issues 的 Done，不提前关闭；#6 继续等待后周 #29。
- [ ] 下周输入、风险和所有未完成项均有明确所有者/期限。

## 8. 风险与问题

| 风险 | 信号/影响 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|
| mock 掩盖真实集成失败 | 组件通过但真实权限/查询不通 | 真实 adapter + 测试数据库验证，退回功能作者 | Joshua（协调），具体功能作者（修复） | Sprint 总 PR 前；下一工作日同一时间复查阻断 |
| 本人代写功能 | 功能 PR 缺测试或输出违约 | 记录归属并退回作者，不扩张本人文件范围 | Joshua | 单次集成前 |
| 项目状态与证据不符 | 非作者 review 缺失却 Testing/Done | 手动按真实证据维护，不自动推进 | Joshua | 总 PR 前 |
| 共享环境不满足 | 无法执行权限/数据库/回滚 | 记录尝试、影响、所需帮助与具体复查点，保持未通过 | Joshua | 周末验收前；超过一个工作日升级 |

## 9. 未完成项处理

每项阻断包含原因、影响、已尝试动作、所需帮助、具体负责人、开始时间、下一工作日同一时间的检查点。安全问题立即升级；其他阻断超过一个工作日升级。普通既有/其他工作包缺陷按归属处理，不以 review 强迫当前作者越界。新功能默认 Post-MVP，P0和权限不得因期限跳过。

## 10. 周末交接

- 已完成：当前为计划编制；开发、review、验收与交付结果待实际执行后填写。
- 未完成：本计划所有验收和集成，由 Joshua 在开发第 6 周收尾时完成；缺失功能退回对应作者并保留负责人/期限。
- 输出合同：验收记录、真实 SHA/命令/场景结果、PR/checks/review/Project 核对记录。
- 集成注意事项：唯一 Sprint 总 PR，独立 review，禁止提前 Done；不得把本次计划推送称为功能上线。
- 下周输入：开发第 7 周接收活动/时间窗口、Participant port、报名状态、独立聚合和三角色虚构 fixture，后续实现 QR、签到和晚餐核验。
