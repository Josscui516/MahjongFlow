# Shiying：课程第 4 周（开发第 3 周）独立工作计划

所属统一周计划：[会议记录流程与 Sprint 3 收尾](WEEK_3_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Li 的会议领域服务](LI_WEEKLY_WORK_PLAN.md)；独立开发阶段使用冻结 `MeetingHistoryItem` fixture。

### Sprint 交付路线

- GitHub Sprint：`Sprint 3`；
- Sprint 集成分支：`sprint/3-meeting-management`；
- 本工作包 Issue 分支：`feature/14-meeting-history`；
- 成员 PR base：`sprint/3-meeting-management`；
- Sprint 总 PR 主要 Issue：#2；
- 唯一交接对象：Joshua。

## 1. 独立目标

独立完成 #14：提供受保护、稳定排序、具备 loading／empty／success／error 状态的会议历史列表和详情导航，证明更新后的会议仍可发现并重开，同时不暴露永久删除，满足 M-04、M-05、M-06。

## 2. 工作包与文件所有权

- 成员姓名：Shiying；GitHub assignee：`Scarletthekiller`；
- 独立工作包：WP-D 会议历史与非破坏性界面；
- 主要 Issue：#14；
- 允许修改：`src/features/meetings/history/`、`src/app/(dashboard)/meetings/page.tsx` 及相邻 loading／error 文件、#14 专属组件／集成／路由测试；
- 禁止修改：Li 的 core／server、Xuanwei 的 agenda、Yubo 的 editor／新建／详情路由、Joshua 的共享 harness／fixture、数据库 migration（除非 #14 经正式范围决定需要且重新分配所有权）；
- 固定输入合同：`MeetingHistoryItem`、详情 URL `/meetings/[meetingId]`、排序 `startsAt DESC, id ASC`、现有 auth guard；
- 输出合同：history query adapter、历史列表与四类状态、描述性详情链接、无 destructive action；
- 功能自身测试：M-04、M-05、M-06、稳定排序、空／失败状态、直接 URL 拒绝与无 DELETE path；
- 共享验收平台边界：Joshua 的 harness 只消费公开 adapter，Shiying 不修改共享配置。

## 3. 开始条件

- #14 已分配给 Shiying、加入 `Sprint 3` 并达到 `Ready`；
- `MeetingHistoryItem` 和详情 URL 已冻结；
- 已读取当前 Next.js 本地文档中 Server Components、loading／error、links 和 dynamic routes 主题；
- 共享 feedback／layout 组件可用；
- #12 未合并时可用虚构 fixture 独立推进。

## 4. 独立执行步骤

### 步骤 1：建立历史列表基线

执行：

1. 定义 history query port 和 `MeetingHistoryItem` fixture；
2. 冻结排序、空状态、安全摘要和详情链接合同；
3. 审计页面、Server Action、Route Handler 和客户端是否存在会议永久 DELETE；
4. 记录归档不在本周范围。

产出：历史列表与非破坏性边界合同。

检查：相同时间的记录按 ID 稳定排序，界面无删除控件。

### 步骤 2：完成核心实现

执行：

1. 实现 backend session 检查后的历史查询；
2. 实现列表页面、loading、empty、success、system error；
3. 提供可访问的描述性详情链接；
4. 不查询或渲染参与者敏感数据，不添加 delete／archive 操作。

产出：#14 历史浏览流程。

检查：更新会议可重新发现并进入详情；空结果不显示空白页面。

### 步骤 3：个人测试与边界验证

执行：

1. 覆盖排序、更新后重开、空列表和查询失败；
2. 覆盖 anonymous／participant 页面和直接请求拒绝；
3. 搜索并验证无会议永久 DELETE UI、服务端入口或普通数据库能力；
4. 运行 lint、typecheck、#14 测试和 build，并做键盘／窄屏检查。

产出：M-04、M-05、M-06 验证证据。

检查：四类状态可区分，链接可用，权限拒绝不返回会议内容。

### 步骤 4：成员 PR 与一次性交接

执行：

1. 整理查询、UI 状态、测试与无 delete 证据；
2. 创建只关联 #14、base 为 Sprint 分支的成员 PR；
3. 完成非作者 review 和 checks；
4. 在 #12 之后接真实 query；需要 core 变化时由 Li 修改；
5. 合并后保持 #14 为 `Testing`，向 Joshua 一次性交接。

产出：#14 成员 PR 与交接摘要。

检查：Joshua 可按公开 adapter 复验 M-04／05／06。

## 5. 低频沟通规则

- 周初只确认 history item、排序和详情 URL；
- #12 未实现时使用 fixture，不持续等待；
- 只有权限泄露、查询合同阻断或发现 destructive path 时立即沟通；
- 不修改 Li、Xuanwei、Yubo 或 Joshua 的文件；
- 完成后只向 Joshua 交接一次。

## 6. 个人交付物

- history query adapter 与稳定投影；
- 会议历史列表、loading／empty／success／error；
- 详情导航和无 destructive path 证明；
- M-04、M-05、M-06 功能测试；
- #14 PR 和交接摘要。

## 7. 个人验收清单

- [ ] M-04、M-05、M-06 全部通过；
- [ ] 只修改 history 与列表路由范围；
- [ ] 排序稳定，更新会议可发现并重开；
- [ ] loading、empty、success、error 可区分；
- [ ] anonymous／participant 页面与服务端拒绝且无数据；
- [ ] UI、服务端和数据库无会议永久 delete；
- [ ] lint、typecheck、功能测试和 build 通过；
- [ ] PR 的 Sprint、base/head、Issue 和文件范围正确；
- [ ] 合并后 #14 保持 `Testing`；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| history projection 与 #12 不一致 | 集成失败 | 真实 adapter 无法映射冻结字段 | 提交合同变更请求，由 Li 调整 core 输出 | Shiying／Li | 单次集成前 |
| 排序依赖客户端时区 | 列表不稳定 | 同数据在不同时区顺序变化 | 服务端按时间戳与 ID 排序，UI 仅按 Sydney 语义展示 | Shiying | 请求 review 前 |
| 误加 archive／delete | 范围扩大或数据风险 | 页面出现破坏性入口 | 移除入口；需求转 backlog | Shiying | 成员 PR 前 |

## 9. 未完成项处理

- M-04／05／06 或权限失败阻止交接；
- 非阻断视觉改进进入 backlog；
- 不修改 core 文件绕过 projection；
- 新需求不扩大 #14。

## 10. 周末交接

- 已完成：#14 历史浏览与 M-04／05／06 证据；
- 未完成：按真实结果记录原因、负责人和期限；
- 输出合同：history adapter、状态组件、详情 URL；
- 集成注意事项：在 #12 后接真实 DTO；
- Sprint 总 PR 证据：Issue、checks、review、无 delete 和权限摘要；
- 下周建议：保持历史列表只承担会议浏览，不混入任务来源导航。
