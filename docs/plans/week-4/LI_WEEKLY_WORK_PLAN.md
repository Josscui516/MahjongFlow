# Li：课程第 5 周（开发第 4 周）独立工作计划

所属统一周计划：[决策转任务与 Sprint 4 阶段评审](WEEK_4_IMPLEMENTATION_PLAN.md)

直接依赖文档：无

### Sprint 交付路线

- GitHub Sprint：`Sprint 4`；
- Sprint 集成分支：`sprint/4-decision-to-task`；
- 本工作包 Issue 分支：`feature/15-task-core-crud`；
- 成员 PR base：`sprint/4-decision-to-task`；
- Sprint 总 PR 主要 Issue：#3；
- 唯一交接对象：Joshua。

## 1. 独立目标

独立交付 #15 的任务基础能力，使已登录委员会用户可以创建、查看、更新并刷新读取任务，服务端与数据库只接受 `Not Started`、`In Progress`、`Completed` 三种状态，匿名／参与者在路由、服务端和 RLS 层均不能读取或修改任务。

## 2. 工作包与文件所有权

- 成员姓名：Li Zhang；
- 独立工作包：WP-A 任务基础 CRUD、持久化与状态约束；
- 主要 Issue：#15；
- 允许修改：`src/features/tasks/core/`、`src/features/tasks/editor/`、`src/app/(dashboard)/tasks/` 的基础 list／new／detail／edit 路由及 #15 专属测试；现有 schema 确有缺口时可新增 #15 timestamped migration、数据库测试、运维说明并重新生成数据库类型；
- 禁止修改：`src/features/tasks/conversion/`、`src/features/tasks/source-navigation/`、会议 agenda／history 实现、Joshua 的共享验收目录；
- 固定输入合同：Week 2 `tasks` 表、task status enum、RLS、认证服务、`profiles` 单一负责人关系；
- 输出合同：`TaskEditorPort`、`TaskRecordDTO`、create／get／update 服务端入口、稳定 discriminated error、任务基础页面和两个只读导航挂载点；
- 功能自身测试：T-01、T-02、T-08 所需的单元、路由、服务端、持久化、约束和 RLS allow／deny 测试；
- 共享验收平台边界：`tests/acceptance/decision-to-task/`、跨包 fixture、Sprint 级回归和验收记录由 Joshua 拥有，Li 不接管。

## 3. 开始条件

- #15 的验收条件、依赖 #10／#11、文件所有权和 `Sprint 4` Project 字段已由 Joshua 手动确认；
- `sprint/4-decision-to-task`、成员分支和 PR base 已确认，Li 没有第二个主要 Issue 处于 `In Progress`；
- 已核对现有 task schema、constraints、RLS 和生成类型；不得因旧 Issue 描述重复建表；
- 已读取当前 Next.js 本地文档中 forms／Server Actions、Server Components、dynamic routes 和 loading／error 的适用章节；
- 使用虚构 assignee 和任务数据，环境中不记录或输出密钥。

## 4. 独立执行步骤

### 步骤 1：建立任务基线与冻结合同

执行：

1. 对照 #15、T-01／T-02／T-08 核对现有 task schema、RLS、索引和权限边界；
2. 将任务数据区分为 immutable DTO、纯校验／映射函数、应用服务和 Supabase adapter；
3. 冻结 `TaskEditorPort`、`TaskRecordDTO`、错误语义和 Yubo 使用的只读详情挂载点。

产出：#15 合同、测试矩阵和 schema 差异判断。

检查：每个验收场景都有实现层和测试层；若无需 migration，PR 明确记录 N/A 原因。

### 步骤 2：完成任务 CRUD 与状态约束

执行：

1. 实现 title、description、单一 assignee、due date、persisted status 及可选来源／活动 IDs 的明确 DTO 与校验；
2. 实现窄服务端 create／get／update 边界和 Supabase adapter，保持认证、授权、错误映射及刷新可重放；
3. 实现任务列表、新建、详情和更新页面，覆盖 loading、empty、success、validation、permission denied、not found、duplicate submission 和 system error 的适用状态；
4. 只在现有数据库合同无法满足验收时增加前向 migration、约束／RLS 测试、回滚说明和生成类型。

产出：可独立运行的任务基础流程和供其他工作包消费的公开 port／DTO。

检查：Client Component 不导入 server-only 模块；未知 status 在服务端或数据库被拒绝，且不出现可选择的 `Overdue`。

### 步骤 3：个人测试与边界验证

执行：

1. 验证任务 create／read／update／refresh 和三种允许状态；
2. 验证缺失字段、未知状态、not found、系统失败和重复提交；
3. 验证 committee／authorised allow，以及 anonymous／participant 的 route／server／RLS deny；
4. 运行 #15 专属测试、lint、typecheck，并在本工作包可构建时运行 build 与适用数据库测试。

产出：T-01、T-02、T-08 的个人验证证据及实际命令结果。

检查：功能成功、失败、权限和持久化场景全部通过，无真实资料或 secret 出现在证据中。

### 步骤 4：成员 PR 与一次性交接

执行：

1. 整理公开合同、schema／migration 影响、测试结果、风险和两个导航挂载点；
2. 创建或更新只关联 #15、以 Sprint 集成分支为 base 的成员 PR；
3. 完成自查、非作者 review 和必要 checks；
4. 合并到 Sprint 分支后确认 #15 保持 `Testing`；
5. 向 Joshua 一次性交付 PR、合同、测试和后续消费者注意事项。

产出：#15 成员 PR 和可供 #23／#24／#25 接入的交接包。

检查：Joshua 无需阅读未说明的实现细节即可按合同集成，且不需要替 Li 补功能测试。

## 5. 低频沟通规则

- 周初只确认一次范围、文件所有权、port／DTO、导航挂载点和 Sprint 路线；
- 独立期间不安排日常同步；只有合同无法表达验收、阻断超过约定时间或出现安全／数据完整性问题时沟通；
- 不直接修改其他成员目录；消费者变更请求由 Li 判断并在本工作包内实施；
- 工作包完成后只向 Joshua 一次性交接，周末集中进行非作者审查。

## 6. 个人交付物

- 任务 core／editor、基础路由和稳定 `TaskEditorPort`／`TaskRecordDTO`；
- T-01、T-02、T-08 功能自身测试；
- schema／RLS／migration／生成类型及回滚影响说明；
- PR 风险、未完成项和一次性交接记录；
- #15 成员 PR 与 Sprint 集成证据。

## 7. 个人验收清单

- [ ] T-01、T-02、T-08 通过；
- [ ] 只修改允许文件范围，输出符合冻结合同；
- [ ] 三种允许状态可保存，未知状态被拒绝，`Overdue` 未持久化；
- [ ] route／server／RLS allow-deny 与 UI 状态覆盖完整；
- [ ] migration、数据库测试、回滚和生成类型影响已正确处理或明确 N/A；
- [ ] lint、typecheck、专属测试和适用 build 通过；
- [ ] 一次性交接包完整，PR base/head、主要 Issue 和范围正确；
- [ ] 合并后 #15 保持 `Testing`，未提前关闭；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| 现有 task schema 与 #15 旧描述不一致 | #23–#25 消费错误合同 | T-01／T-02 无法通过或生成类型冲突 | 停止重建旧 migration；记录差异并用新前向 migration 修正 | Li | 单次集成前 |
| task port 在消费者开发后变化 | 三个下游工作包返工 | 字段／错误语义必须破坏性修改 | 提交合同变更记录、fixture 迁移和复验范围，由 Joshua 决定是否阻断 | Li | 发现当日 |

## 9. 未完成项处理

- 阻断 #23–#25 的合同问题立即记录；非阻断体验改进进入 backlog；
- 不通过修改 conversion、source-navigation 或 Joshua 验收文件绕过阻断；
- 未通过 T-01／T-02／T-08 或数据库门禁不得交接为完成；
- 安全、权限、数据丢失或密钥风险立即升级。

## 10. 周末交接

- 已完成：任务基础 CRUD、状态约束、权限和刷新持久化；
- 未完成：逐项记录原因、负责人、期限与下次检查时间；
- 输出合同：`TaskEditorPort`、`TaskRecordDTO`、稳定错误语义和导航挂载点；
- 集成注意事项：#23 只消费公开 port，不直接调用 repository；#25 只使用详情挂载点；
- Sprint 总 PR 证据：#15 Issue、PR、checks、review、T-01／T-02／T-08 摘要和 migration 影响；
- 下周建议：将稳定 task DTO 提供给 #16、#20，不提前实现其业务规则。
