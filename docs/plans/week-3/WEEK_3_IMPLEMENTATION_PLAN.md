# 课程第 4 周（开发第 3 周）：会议记录流程与 Sprint 3 收尾

> 本计划依据[《MVP 项目企划书》](../../project/MVP_PROJECT_PROPOSAL.md)编制。本周只交付 `US-01`、`MEET-01` 至 `MEET-05` 与验收场景 M-01 至 M-06，不提前实现决策转任务、任务、Dashboard、活动或参与者数据能力。

## 1. 本周目标

完成可演示的会议记录流程：委员会与 authorised 用户可以创建、查看、更新和浏览会议，保存有序讨论点与关键决策；匿名／参与者访问在路由、服务端和 RLS 层均被拒绝；会议不提供永久删除；M-01 至 M-06 形成可复验的集成证据。

### Sprint 交付路线

- GitHub Sprint：`Sprint 3`；
- Sprint 集成分支：`sprint/3-meeting-management`；
- 集成负责人：Joshua；Joshua 只在其余四个工作包进入 `Testing` 后开始 Sprint 收尾；
- Sprint 总 PR 主要 Issue：#2；
- Sprint 总 PR 路线：`sprint/3-meeting-management` → `main`；
- 其余纳入工作包 Issues：#12、#13、#14、#56；
- 远程分支与分支保护负责人：仓库管理员 `Josscui516`；Project `Sprint`／`Status`／`Assignee`／`Acceptance Gate` 从 Sprint 3 起由 Joshua 手动维护；
- 2026-08-16 写入核对结果：#56 已创建并作为 #2 的 sub-issue 分配给 Yubo；#12 已正式收窄到 core／server／persistence 并分配给 Li；`sprint/3-meeting-management` 已从当时最新 `origin/main` 创建；#2、#12、#13、#14、#56 已由 Joshua 手动设为 `Sprint 3`／`Ready`／`Incomplete` 并补齐负责人、依赖和工作量。

### 成员独立工作文档

- [Li：会议核心记录与持久化](LI_WEEKLY_WORK_PLAN.md)
- [Xuanwei：讨论点与关键决策](XUANWEI_WEEKLY_WORK_PLAN.md)
- [Shiying：会议历史与非破坏性界面](SHIYING_WEEKLY_WORK_PLAN.md)
- [Yubo：会议创建与更新 UI](YUBO_WEEKLY_WORK_PLAN.md)
- [Joshua：共享验收、Sprint 3 集成与收尾](JOSHUA_WEEKLY_WORK_PLAN.md)

### GitHub Project 分配

| 顺序 | 成员 | GitHub 账号 | 主要 Issue | 工作包 |
|---|---|---|---|---|
| 1 | Li | `Kaia-Zhang` | #12 | WP-A 会议领域服务与持久化 |
| 2 | Xuanwei | `YUHAN2233` | #13 | WP-B 有序讨论点与关键决策 |
| 3 | Yubo | `Caiqwe123` | #56 | WP-C 会议创建与更新 UI |
| 4 | Shiying | `Scarletthekiller` | #14 | WP-D 会议历史与非破坏性界面 |
| 5 | Joshua | `Josscui516` | #2 | WP-E 共享验收、集成与 Sprint 收尾 |

## 2. 上周输入与开始条件

- Sprint 2 已在 GitHub Project 显示为 `Done`，认证、角色、核心表、RLS、共享 UI 与测试入口可作为本周输入；
- `meetings`、`meeting_attendees`、`discussion_points`、`meeting_decisions` 及其约束、RLS 和生成类型已由 Week 2 migration 建立，本周不得重复建表；仅在验收发现现有合同确有缺口时增加新的 timestamped migration；
- #12、#13、#14 的 Issue 正文、M-01 至 M-06、PG-05 至 PG-07、权限矩阵与文件边界已核对；
- Yubo 的独立功能 Issue #56、#12 的 core／server 收窄、五项负责人和 Project 字段已完成手动写入；后续状态只能按真实分支、PR、审查与验收证据由 Joshua 手动推进；
- `sprint/3-meeting-management` 必须从最新 `main` 创建，成员分支均从该分支创建并以该分支为 PR base；
- 开始 Next.js 实现前，各实现者必须读取当前安装版本 `node_modules/next/dist/docs/` 中与 Server Components、forms／Server Actions、loading／error 和 dynamic routes 对应的文档；
- 所有 fixture、测试、截图和演示只使用虚构数据。

## 3. 本周范围

### 3.1 必须完成

- #12：会议基础字段、参会人、领域验证、服务端 create／read／update、持久化和 M-01／M-02／M-05 的服务端／数据库部分；
- #13：有序讨论点与关键决策、原子失败行为和 M-03；
- #56：会议新建、详情、更新 UI，字段级 validation、提交 success／error、permission denied 和 M-01／M-02／M-05 的界面／路由部分；
- #14：按日期稳定排序的历史列表、空／错误状态、详情导航和 M-04／M-06／M-05；
- #2：在前四个功能工作包进入 `Testing` 后，由 Joshua 建立共享 fixture／M-01 至 M-06 harness，并完成完整集成、回归、权限与 Sprint 总 PR 收尾。

### 3.2 条件允许时完成

- 对会议表单执行窄屏、键盘顺序和状态非纯色表达检查；
- 为下周 #23 提供只读的决策／讨论点公共 DTO 与稳定查询合同，但不出现“创建任务”入口。

### 3.3 明确不做

- 不实现 #23–#25 的决策转任务、来源链接或任务页面；
- 不实现会议永久删除；没有单独批准时也不增加归档能力；
- 不修改参与者、报名、签到、晚餐资格或公开 token 流程；
- 不重写 Week 2 migration；schema 修正只能使用新的 timestamped migration；
- 不把 Joshua 的共享验收工具包替代为各功能 Issue 本应提供的最小测试；
- 未经用户明确授权，不创建 Issue、改 Project、建分支、提交、push、创建 PR 或合并。

## 4. 五个独立工作包

| 成员 | 独立工作包 | 主要文件所有权 | 固定输入合同 | 输出合同 | 个人验证 |
|---|---|---|---|---|---|
| Li | WP-A #12 会议领域服务与持久化 | `src/features/meetings/core/`、`src/features/meetings/schemas.ts`、#12 专属单元／集成／数据库测试；必要的新 #12 migration | Week 2 schema／RLS；认证／授权服务 | `MeetingRecordDTO`、`MeetingEditorPort`、create／read／update 服务端入口、`MeetingHistoryItem` | M-01、M-02、M-05 的服务端／数据库验证、刷新持久化与拒绝路径 |
| Xuanwei | WP-B #13 讨论点与关键决策 | `src/features/meetings/agenda/`、#13 专属测试；必要的新 #13 migration | `MeetingRecordDTO.id`；固定 `MeetingAgendaSection`；Week 2 子表合同 | `MeetingAgendaDTO`、有序编辑组件与原子保存适配器 | M-03；顺序、归属、外键、无部分写入、committee／authorised allow |
| Yubo | WP-C #56 会议创建与更新 UI | `src/features/meetings/editor/`、`src/app/(dashboard)/meetings/new/`、`src/app/(dashboard)/meetings/[meetingId]/` 及相邻 loading／error、路由／组件测试 | Li 的 `MeetingEditorPort`；Xuanwei 的 `MeetingAgendaSection`；Sprint 2 共享表单／反馈组件 | 新建／详情／更新页面、编辑组合壳、字段级和提交状态反馈 | M-01、M-02、M-05 的 UI／路由路径；loading、validation、success、permission denied、system error、键盘／窄屏 |
| Shiying | WP-D #14 会议历史与非破坏性界面 | `src/features/meetings/history/`、`src/app/(dashboard)/meetings/page.tsx` 及相邻 loading／error、#14 专属测试 | `MeetingHistoryItem` 投影；详情 URL 合同 | 稳定排序历史列表、空／错误状态、详情链接；无 delete 入口 | M-04、M-05、M-06；排序、重开、空／失败、无 destructive path |
| Joshua | WP-E #2 共享验收、集成与 Sprint 收尾 | `tests/acceptance/meetings/`、`tests/fixtures/meetings/`、`docs/plans/week-3/US_01_ACCEPTANCE_RECORD.md`、Sprint 集成记录和总 PR 描述 | 前四个功能 PR 已进入 `Testing`；M-01–M-06 公开 adapter；Project Sprint 成员 | 可失败的跨包 harness、脱敏 fixture、集成结果、权限／隐私／migration 复核、总 PR 与交接 | harness 自检、完整质量命令、M-01–M-06、三层权限、Project 与 PR 核对 |

### PR 路线与集成顺序

| 工作包 | Issue 分支 | PR base | 进入 Sprint 分支的条件 | 集成顺序 |
|---|---|---|---|---|
| WP-A / #12 | `feature/12-meeting-core-persistence` | `sprint/3-meeting-management` | 服务端 M-01／02／05、feature／database tests、migration 影响说明、非作者 review 和 checks 通过 | 1 |
| WP-B / #13 | `feature/13-meeting-agenda-decisions` | `sprint/3-meeting-management` | M-03、原子失败、权限和非作者 review 通过 | 2 |
| WP-C / #56 | `feature/56-meeting-editor-ui` | `sprint/3-meeting-management` | 新建／详情／更新 UI、状态、路由权限、组件测试和非作者 review 通过 | 3 |
| WP-D / #14 | `feature/14-meeting-history` | `sprint/3-meeting-management` | M-04／05／06、无 delete path、状态测试和非作者 review 通过 | 4 |
| WP-E / #2 | 不另开成员功能 PR；由 Joshua 在 Sprint 分支建立共享验收并完成总体验收 | `main`（Sprint 总 PR） | 前四项均为 `Testing`，harness 和完整验收通过，Project Sprint 成员精确匹配 | 5 |

独立执行规则：

1. 每名成员只修改其文件所有权范围；
2. #13、Yubo UI 和 #14 在 #12 未集成时使用冻结 DTO、mock 和 adapter 独立推进；
3. Yubo 的编辑组合壳只消费 Li 的 `MeetingEditorPort` 和 Xuanwei 的 `MeetingAgendaSection`，不得复制二者内部逻辑；
4. 需要修改他人文件时只提交变更请求，由文件所有者处理；
5. 四名功能所有者负责各自 Issue 的最小单元、集成、路由、RLS 和回归测试；Joshua 负责共享 harness、fixture 与 Sprint 级证据；
6. Joshua 不在前四个功能包完成前静默开始 #2，也不以共享验收或 Sprint 收尾为由重写其他成员文件；
7. 成员 PR 合并到 Sprint 分支后 Issue 保持 `Testing`；只有 Sprint 总 PR 合并到 `main` 后才能进入 `Done`。

## 5. 固定接口与文件边界

| 合同／边界 | 提供者 | 使用者 | 冻结内容 | 允许变更条件 |
|---|---|---|---|---|
| `MeetingEditorPort`／`MeetingRecordDTO` | Li | Yubo、Xuanwei、Shiying、Joshua | `createMeeting`、`getMeeting`、`updateMeeting`；DTO 含 `id`、`title`、`startsAt`、`summary`、`attendeeIds`，审计字段只读；错误使用稳定 discriminated result | M-01／M-02／M-04 无法表达或现有 schema 与权威文档冲突 |
| `MeetingAgendaSection` | Xuanwei | Yubo | 以 meeting ID 读取／提交有序 discussion／decision 项；失败不产生部分子记录 | M-03 或原子失败无法验收 |
| `MeetingHistoryItem` | Li | Shiying | `id`、`title`、`startsAt`、安全摘要；按 `startsAt DESC, id ASC` 稳定排序 | 历史查询无法稳定重放或 M-04 失败 |
| 会议权限合同 | Week 2 auth／RLS 输出 | 全体 | committee 与 authorised C/R/U；anonymous／participant 无业务表访问；无会议 DELETE | M-05、PERM-P01 或 PERM-N01／02 失败 |
| M-01–M-06 adapter／fixture | Joshua | Sprint 总验收 | 每场景有前置 fixture、执行入口、预期结果和缺失集成失败；只消费四个功能包公开输出 | harness 无法区分未接入与通过 |

冲突规则：文件所有者保留本周编辑权。合同需要变化时记录原因、影响场景和迁移／回滚影响，由提供者实施并重新运行受影响测试。

## 6. 三个团队检查点

### 检查点 1：周初合同冻结

- 已创建 #56 并正式收窄 #12 的文件所有权；Joshua 已手动确认 #2、#12–#14、#56 的 Project `Sprint 3`、assignee、依赖和验收字段；
- 确认 Sprint 分支、五个工作包、文件所有权与第 5 节合同；
- 确认 #12／#13 不重复创建 Week 2 已存在的表或 policy；
- 冻结后各成员使用 mock／adapter 独立执行。

### 检查点 2：单次集成

- 按 #12 → #13 → Yubo UI → #14 的顺序合并成员 PR；
- 每个 PR 只关联一个主要 Issue，base 必须为 `sprint/3-meeting-management`；
- 只修复冻结合同不一致、安全问题和直接阻断，不在集成点扩大范围；
- 合并后对应 Issue 保持 `Testing`。

### 检查点 3：Joshua 周末收尾

- 前四个功能包均进入 `Testing` 后，Joshua 才开始 #2 和共享验收；
- 核对 Project 中 `Sprint 3` 的 Issue 完整集合与总 PR 声明完全一致；
- 运行 lint、typecheck、应用测试、数据库测试、build 和 M-01 至 M-06；
- 复核 route／server／RLS 拒绝、migration 顺序与回滚、虚构数据和无永久删除；
- 创建 #2 为主要 Issue 的 Sprint 总 PR；取得非作者 review 和全部 checks 后，合并仍需用户另行明确授权。

## 7. 本周交付物

- #12 会议领域验证、服务端入口和持久化；
- #13 有序讨论点／决策与原子保存；
- Yubo 的会议新建／详情／更新 UI、编辑组合壳和交互状态；
- #14 会议历史、状态反馈和非破坏性边界；
- Joshua 的会议验收 harness、虚构 fixture、`US_01_ACCEPTANCE_RECORD.md`、Sprint 总 PR 证据和 Week 4 Ready 输入。

## 8. 本周验收清单

- [x] #56 已创建，#12 所有权已正式收窄，Sprint 集成分支已创建；
- [x] Joshua 已手动核对五项 Sprint 成员与全部 Project 字段；
- [ ] 5 个独立工作包分别完成个人验收且无文件所有权冲突；
- [ ] M-01 至 M-06 全部通过；
- [ ] committee／authorised 正向路径与 anonymous／participant 路由、服务端、RLS 拒绝均通过；
- [ ] loading、empty、success、validation error、permission denied 和 system error 状态按适用范围覆盖；
- [ ] 会议、参会人、讨论点和决策使用现有 schema；任何增量 migration 均可重放、有回滚说明且类型已重新生成；
- [ ] 页面、服务端和数据库均未暴露会议永久删除；
- [ ] 功能自身测试与共享验收平台责任未混淆；
- [ ] 每个成员 PR 完成一次集中非作者审查并合并到 Sprint 分支，Issue 保持 `Testing`；
- [ ] Joshua 最后执行 Sprint 收尾，未提前占用第二个主要 `In Progress` Issue；
- [ ] Sprint 总 PR 的主要 Issue、纳入 Issues、base/head 与 Project Sprint 成员一致；
- [ ] lint、typecheck、应用测试、数据库测试和 build 通过；
- [ ] 测试、日志、截图与文档无密钥或真实资料；
- [ ] 阻断缺陷为零，Week 4 #23–#25 的输入达到 Ready。

## 9. 风险与应对

| 风险 | 信号 | 影响 | 应对 | 所有者 |
|---|---|---|---|---|
| Sprint 3 Project 字段后续漂移 | #2、#12–#14、#56 的 Sprint／Status／assignee 与真实分支或 PR 不一致 | WIP、集成顺序或总 PR 集合失真 | Joshua 在每个检查点按手动维护规则逐项复核，发现不一致立即回到真实状态 | Joshua |
| #12 与 #56 合同边界被后续改写 | diff 同时触及 core／server 与 editor／routes | PR 冲突、验收归属不清 | 保持 #12 属于 Li、#56 属于 Yubo；合同变化回到对应所有者 | Li／Yubo |
| #12 阻塞 #13／Yubo／#14 | DTO 或查询合同频繁变化 | 并行工作返工 | 周初冻结 port／DTO；消费者使用 mock；只在单次集成接真实实现 | Li |
| Week 2 schema 与 Issue 旧描述重复 | 出现重建表或重写旧 migration 的方案 | migration 冲突和生产风险 | 以当前 main 为准；只允许新的前向 migration，若无数据差异明确写 N/A | Li／Xuanwei |
| 会议权限只在 UI 生效 | 直接接口或数据库可读 | M-05 与安全门禁失败 | 功能包内覆盖 route／server／RLS；Joshua 收尾复跑三层拒绝 | Xuanwei／Joshua |
| Joshua 过早介入实现 | #2 与其他工作包同时 `In Progress` | WIP 超限与所有权冲突 | #2 仅在前四项 `Testing` 后开始；此前只做只读准备 | Joshua |

## 10. 本周完成定义

1. #12、#13、#14 与 #56 均通过个人验收、非作者 review 并进入 `Testing`；
2. Joshua 最后完成 #2 的共享 harness、M-01 至 M-06 集成验收和 `US_01_ACCEPTANCE_RECORD.md`；
3. 会议业务成功、失败、空状态、权限和非破坏性边界均可复验；
4. lint、typecheck、应用测试、数据库测试和 build 全部通过；
5. migration、RLS、生成类型、虚构数据和回滚影响已核对；
6. Sprint 总 PR 内容与 GitHub Project `Sprint 3` 成员完全一致；
7. 阻断问题为零，非阻断问题有负责人、期限和下次检查时间；
8. 只有经明确授权把 Sprint 总 PR 合并到 `main` 后，整组 Issues 才进入 `Done`。

## 11. 未完成项处理

- Sprint 3 Project 字段若后续与真实负责人、分支或 PR 状态不一致，先由 Joshua 手动修正再继续交付；
- 合同阻断由提供者处理，消费者不得跨文件所有权修补；
- M-01 至 M-06、权限、数据一致性或全局构建失败会阻止 #2 Sprint 总 PR；
- 非阻断体验建议进入 backlog，不顺手加入本周功能；
- 新需求默认进入 Post-MVP，不能替代未完成的 `US-01`；
- 每个阻塞记录原因、影响、已尝试操作、所需帮助、负责人、开始时间与下次检查时间；超过一个工作日按协作规则升级。
