# Li：课程第 4 周（开发第 3 周）会议领域服务工作计划

所属统一周计划：[会议记录流程与 Sprint 3 收尾](WEEK_3_IMPLEMENTATION_PLAN.md)

直接依赖文档：无；[Yubo 的会议编辑 UI](YUBO_WEEKLY_WORK_PLAN.md)、#13 和 #14 在独立开发阶段消费本工作包冻结的 port／DTO，不要求持续同步。

### Sprint 交付路线

- GitHub Sprint：`Sprint 3`；
- Sprint 集成分支：`sprint/3-meeting-management`；
- 本工作包 Issue 分支：`feature/12-meeting-core-persistence`；
- 成员 PR base：`sprint/3-meeting-management`；
- Sprint 总 PR 主要 Issue：#2；
- 唯一交接对象：Joshua。

## 1. 独立目标

独立完成 #12 的会议领域服务与持久化：使用 Week 2 已有 schema／RLS，实现经过授权和验证的 create／read／update 服务端边界及刷新后持久化，满足 M-01、M-02、M-05 的服务端／数据库责任，并向 Yubo、#13、#14 提供稳定 port／DTO。实际新建、详情和更新页面由 Yubo 的独立功能 Issue 负责。

## 2. 工作包与文件所有权

- 成员姓名：Li；GitHub assignee：`Kaia-Zhang`；
- 独立工作包：WP-A 会议领域服务与持久化；
- 主要 Issue：#12；
- 允许修改：`src/features/meetings/core/`、`src/features/meetings/schemas.ts`、#12 专属单元／服务端集成／数据库测试；仅在现有 schema 有验收缺口时新增 #12 专属 timestamped migration 与对应数据库测试；
- 禁止修改：Yubo 所有的 `src/features/meetings/editor/` 和会议新建／详情路由、`src/features/meetings/agenda/`、`src/features/meetings/history/`、Joshua 所有的 `tests/acceptance/meetings/`／`tests/fixtures/meetings/`、Week 2 migration；
- 固定输入合同：现有 `meetings`、`meeting_attendees`、RLS、`requireBackendUser()`、共享表单／反馈组件；
- 输出合同：`MeetingEditorPort`、`MeetingRecordDTO`、`MeetingHistoryItem` 和 create／read／update 服务端入口；
- 功能自身测试：M-01、M-02、M-05 的服务端字段验证、持久化、授权／RLS 正反向测试；
- 共享验收平台边界：Joshua 拥有跨工作包 harness、共享 fixture 与 Sprint 证据编排，Li 不修改其配置。

## 3. 开始条件

- #12 已正式收窄为 core／server／persistence 所有权，分配给 Li、加入 `Sprint 3` 并达到 `Ready`；
- `sprint/3-meeting-management` 已从最新 `main` 创建；
- 已读取当前 Next.js 本地文档中 forms／Server Actions、dynamic routes、loading／error 主题；
- `MeetingEditorPort`、`MeetingRecordDTO`、`MeetingHistoryItem` 与错误结果已冻结；
- 已确认 Week 2 表、约束和 RLS 可满足大部分 #12 数据需求，不重复建表。

## 4. 独立执行步骤

### 步骤 1：建立数据与验证基线

执行：

1. 对照 #12、M-01／02／05 审计现有 meeting schema、列级权限和 RLS；
2. 建立纯输入规范化与字段验证，明确标题、时间、摘要和至少一名参会人规则；
3. 冻结 port、DTO、错误码和 Sydney 日期提交合同；
4. 只有现有 schema 无法满足验收时才新增前向 migration，并记录回滚、部署顺序和类型生成影响。

产出：#12 数据差距结论、schema／port／DTO／错误合同。

检查：无重复表、无旧 migration 改写；缺少字段不会产生数据库行。

### 步骤 2：完成核心实现

执行：

1. 实现使用当前用户 JWT client 的 create／read／update 边界；
2. 在查询和写入前执行 `requireBackendUser()`、字段白名单和安全错误映射；
3. 返回可供 Yubo 界面稳定映射的 validation、not found、permission denied 与 system error 结果；
4. 不创建页面、Client Component 或 agenda 组合壳。

产出：可由 mock 或集成测试独立调用的会议领域服务。

检查：完整会议写入后可由新请求重新读取且字段一致；无会话请求在查询前被拒绝。

### 步骤 3：个人测试与边界验证

执行：

1. 覆盖完整创建、更新、刷新重读和每个必填字段失败；
2. 覆盖 committee／authorised allow 与 anonymous／participant server、RLS deny；路由拒绝由 Yubo 的功能 Issue 验证；
3. 覆盖重复提交和系统失败不产生部分会议／参会关系；
4. 运行 lint、typecheck、#12 测试、适用数据库测试和 build。

产出：M-01、M-02、M-05 脱敏验证证据。

检查：所有适用检查通过，测试只使用虚构会议和账号 fixture。

### 步骤 4：成员 PR 与一次性交接

执行：

1. 整理 port／DTO、服务端入口、测试、migration N/A 或增量说明；
2. 创建只关联 #12、base 为 Sprint 分支的成员 PR；
3. 完成自查、非作者 review 和 checks；
4. 合并后保持 #12 为 `Testing`；
5. 向 Joshua 交接，并向 Yubo／Xuanwei／Shiying 提供冻结合同，不接管其实现。

产出：#12 成员 PR 与交接摘要。

检查：Yubo 可只依赖 port 完成页面，Joshua 可按公开 adapter 复现服务端 M-01／02／05。

## 5. 低频沟通规则

- 周初一次冻结 port、DTO 和错误合同；
- 只有 schema／RLS 无法满足验收、M-05 失败或接口阻断时临时沟通；
- 不直接修改 Yubo、Xuanwei、Shiying 或 Joshua 文件；
- 工作包完成后一次性交给 Joshua。

## 6. 个人交付物

- 会议输入 schema、纯验证、port 与 DTO；
- create／read／update 服务端入口；
- M-01、M-02、M-05 的服务端／数据库功能测试；
- migration 适用性、权限、隐私、回滚与风险说明；
- #12 成员 PR 和 Sprint 集成证据。

## 7. 个人验收清单

- [ ] #12 与 M-01、M-02、M-05 完成；
- [ ] 只修改允许范围，未重写 Week 2 migration；
- [ ] port／DTO 与 editor／agenda／history 合同一致；
- [ ] server／RLS 正反向权限通过，并已向 Yubo 交付路由所需错误语义；
- [ ] validation、success、permission denied、system error 和重复提交在服务端边界按适用范围覆盖；
- [ ] lint、typecheck、功能测试、适用数据库测试和 build 通过；
- [ ] 无 secret、真实账号或真实参与者数据；
- [ ] PR 的 Sprint、base/head、Issue 与文件范围正确；
- [ ] 合并 Sprint 分支后 #12 保持 `Testing`；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| Issue 描述要求建表但表已存在 | 重复 migration | 发现现有列／约束不能满足 M-01／02 | 先记录差距；只用新 migration 前向修正，否则 PR 写 N/A | Li | 成员 PR 前 |
| editor port 不稳定 | Yubo UI 和 #13／#14 集成返工 | 任一消费者无法使用冻结结果 | 由 Li 修改自有 port／DTO 并复跑 #12 测试 | Li | 单次集成前 |
| #12 与 Yubo 所有权重叠 | 同一页面并行修改 | diff 出现会议路由或 editor 文件 | 停止该改动，把 UI 交回 Yubo 的功能 Issue | Li | 立即 |
| 参会人写入部分成功 | 数据不完整 | 失败路径留下 meeting 或零 attendee | 使用原子边界或补偿失败；加入回归测试 | Li | 请求 review 前 |

## 9. 未完成项处理

- 阻断 M-01／02／05 时立即记录并升级；
- 非阻断 UI 改进进入 backlog；
- 不通过修改其他成员文件绕过合同；
- 新需求不扩大 #12。

## 10. 周末交接

- 已完成：#12 会议领域服务及 M-01／02／05 服务端／数据库证据；
- 未完成：按真实结果填写原因、负责人、期限和下次检查时间；
- 输出合同：`MeetingEditorPort`、`MeetingRecordDTO`、`MeetingHistoryItem` 和服务端入口；
- 集成注意事项：先合入 #12，再接 #13、Yubo UI 和 #14；
- Sprint 总 PR 证据：Issue、checks、review、migration／RLS 与验收摘要；
- 下周建议：保持 DTO 向 #23 只读开放，不提前实现转任务。
