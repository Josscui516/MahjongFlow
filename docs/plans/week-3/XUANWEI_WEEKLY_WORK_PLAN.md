# Xuanwei：课程第 4 周（开发第 3 周）独立工作计划

所属统一周计划：[会议记录流程与 Sprint 3 收尾](WEEK_3_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Li 的会议领域服务](LI_WEEKLY_WORK_PLAN.md)；独立开发阶段使用冻结 `MeetingRecordDTO` mock。完成后由 [Yubo 的会议编辑 UI](YUBO_WEEKLY_WORK_PLAN.md)消费 `MeetingAgendaSection`。

### Sprint 交付路线

- GitHub Sprint：`Sprint 3`；
- Sprint 集成分支：`sprint/3-meeting-management`；
- 本工作包 Issue 分支：`feature/13-meeting-agenda-decisions`；
- 成员 PR base：`sprint/3-meeting-management`；
- Sprint 总 PR 主要 Issue：#2；
- 唯一交接对象：Joshua。

## 1. 独立目标

独立完成 #13：让委员会与 authorised 用户为一个会议维护有序讨论点和关键决策，失败时不产生部分子记录，满足 M-03，并为 Week 4 #23 提供稳定只读输出但不实现任务转换。

## 2. 工作包与文件所有权

- 成员姓名：Xuanwei；GitHub assignee：`YUHAN2233`；
- 独立工作包：WP-B 有序讨论点与关键决策；
- 主要 Issue：#13；
- 允许修改：`src/features/meetings/agenda/`、#13 专属单元／集成／权限测试；仅在现有子表合同有验收缺口时新增 #13 专属 timestamped migration 与数据库测试；
- 禁止修改：Li 的 core／server、Shiying 的 history／列表路由、Yubo 的 editor／新建／详情路由、Joshua 的共享 harness／fixture、Week 2 migration；
- 固定输入合同：`MeetingRecordDTO.id`、`MeetingAgendaSection` 插槽、现有 `discussion_points`／`meeting_decisions` 表和 RLS；
- 输出合同：`MeetingAgendaDTO`、按 position 排序的编辑／显示组件、原子保存适配器和只读来源 DTO；
- 功能自身测试：M-03、无效子项、顺序／归属／外键、committee／authorised allow 与 anonymous deny；
- 共享验收平台边界：Joshua 负责跨包 adapter、fixture 与证据汇总，不替代 #13 测试。

## 3. 开始条件

- #13 已分配给 Xuanwei、加入 `Sprint 3` 并达到 `Ready`；
- #12 的 DTO／插槽合同已冻结，允许用 mock 独立开发；
- 已读取当前 Next.js 本地文档中 forms／Server Actions、Server／Client Components 与错误处理主题；
- 已确认现有 position、唯一约束、FK、D* 与来源 `RESTRICT` 规则；
- 不需要等待 Li 的实际页面实现才开始内部模块。

## 4. 独立执行步骤

### 步骤 1：建立 agenda 合同

执行：

1. 审计现有 discussion／decision schema、约束、RLS 和生成类型；
2. 定义 `MeetingAgendaDTO`、输入 schema、position 重排和安全错误合同；
3. 定义新增、编辑、保存前移除与持久化后显示行为；
4. 明确来源 DTO 仅供下周消费，不增加任务写入口。

产出：agenda 输入／输出和原子失败合同。

检查：两个讨论点与两个决策可用 mock 表达稳定顺序和 meeting ownership。

### 步骤 2：完成核心实现

执行：

1. 实现确定性的排序、规范化和验证纯函数；
2. 实现使用用户 JWT 的读取／写入边界和 backend 授权；
3. 让无效或不完整子项返回字段反馈且不污染会议；
4. 实现可插入 Yubo `MeetingEditor` 组合壳的 agenda 编辑／显示组件。

产出：#13 完整 agenda 模块。

检查：顺序稳定、归属正确、失败无部分写入，且无跨会议修改。

### 步骤 3：个人测试与边界验证

执行：

1. 覆盖 M-03、空白子项、重复 position、错误 meeting ID 和外键失败；
2. 覆盖 committee／authorised 正向以及 anonymous／participant／无 profile 拒绝；
3. 验证被任务来源引用的子项不能通过本模块破坏性删除；
4. 运行 lint、typecheck、#13 测试、适用数据库测试和 build。

产出：M-03 与权限／一致性证据。

检查：失败路径数据库保持原状态；日志和错误不泄露内部细节。

### 步骤 4：成员 PR 与一次性交接

执行：

1. 整理 DTO、组件、服务端入口、测试和 migration 影响；
2. 创建只关联 #13、base 为 Sprint 分支的成员 PR；
3. 完成非作者 review 与 checks；
4. 在 #12 之后接入，页面组合由 Yubo 完成；跨文件改动请求交给对应所有者；
5. 合并后保持 #13 为 `Testing`，向 Joshua 一次性交接。

产出：#13 成员 PR 与交接摘要。

检查：Yubo 可只依赖公开组件完成页面组合，Joshua 可按公开 adapter 运行 M-03。

## 5. 低频沟通规则

- 周初只冻结 DTO、position 和失败语义；
- #12 未完成时使用 mock，不日常等待；
- 需要修改 Yubo 页面或 Li 服务时只提交变更请求；
- 安全、外键或原子写阻断立即沟通；
- 完成后只向 Joshua交接一次。

## 6. 个人交付物

- agenda schema、DTO 与纯排序／验证函数；
- 讨论点／决策读取、原子保存与编辑／显示组件；
- M-03、权限、外键和失败回归测试；
- #13 PR、migration N/A／增量说明和交接摘要。

## 7. 个人验收清单

- [ ] M-03 与 #13 验收全部通过；
- [ ] 只修改 agenda 所有权范围；
- [ ] 两类子项顺序和 meeting ownership 正确；
- [ ] 无效输入不产生部分写入；
- [ ] committee／authorised allow 与 anonymous／participant deny 通过；
- [ ] 未暴露 delete 或任务转换能力；
- [ ] lint、typecheck、功能测试、适用数据库测试和 build 通过；
- [ ] PR 的 Sprint、base/head、Issue 和文件范围正确；
- [ ] 合并后 #13 保持 `Testing`；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| editor port 或插槽合同不一致 | 无法接入页面 | 单次集成编译或交互失败 | 提交最小变更请求，由 Li 修正 port 或 Yubo 修正组合壳 | Xuanwei／Li／Yubo | 集成检查点内 |
| 多子项写入非原子 | 会议内容损坏 | 任一失败留下部分变更 | 使用事务性边界或安全替代，并加入故障回归 | Xuanwei | 请求 review 前 |
| 为下周过度设计 | 范围扩张 | 出现 task create／source navigation | 只保留只读 DTO，删除本周任务入口 | Xuanwei | 成员 PR 前 |

## 9. 未完成项处理

- M-03、权限或数据一致性失败阻止交接；
- 非阻断交互建议进入 backlog；
- 不修改 Li 或 Yubo 文件绕过集成；
- 新需求不扩大 #13。

## 10. 周末交接

- 已完成：#13 agenda 模块与 M-03 证据；
- 未完成：按真实结果记录原因、负责人和期限；
- 输出合同：`MeetingAgendaDTO`、组件、原子保存 adapter、只读来源 DTO；
- 集成注意事项：#12 提供 meeting ID／服务端合同，由 Yubo 将本组件接入编辑页面；
- Sprint 总 PR 证据：Issue、checks、review、权限／数据一致性摘要；
- 下周建议：由 #23 消费只读来源 DTO，不反向修改 agenda 内部文件。
