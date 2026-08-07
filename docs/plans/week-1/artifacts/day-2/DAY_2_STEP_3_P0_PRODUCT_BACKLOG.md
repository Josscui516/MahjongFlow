# 第 2 天步骤 3：P0 Product Backlog 与覆盖审计记录

## 1. 执行结论

第 2 天步骤 3 已完成。已在 `Josscui516/MahjongFlow` 建立 8 个 P0 epic 和
29 个可独立验收的实施 Issue，并全部加入
[MahjongFlow MVP GitHub Project](https://github.com/users/Josscui516/projects/5)。

Day 2 完成时的 37 个 Issue 均保持 `Backlog` 状态，没有在完成开始条件检查前提前移动。
每个实施 Issue 均包含用户价值、P0 ID、实施范围、
数据库与权限要求、UI 状态、验收条件、验证方式、依赖、下游任务、目标周
和相对工作量。

2026-08-07 同步复核后，Project 已增加 `Story ID`、`Item Type` 和 `Sprint`
字段以及 `Product Backlog`、`Current Sprint` 视图。29 个实施 Issue 的正文
均补充正式 User Story，或在横切工程工作上补充 Enabler 分类；六个规范
User Stories 与 Issue 映射见
[Backlog 与 Sprint 管理基线](../../../../product/BACKLOG_AND_SPRINT_MANAGEMENT.md)。

2026-08-07 Week 2 refinement 又建立 #39（Li 的 Schema／constraints）、#40
（Xuanwei 的 RLS／authorization）和 #41（Yubo 的测试／验收基础）。它们拆分
既有 #10／#1 范围以支持独立分支、验收和负责人，不增加新的 MVP 能力。
当前 Product Backlog 因此为 8 个 epic 和 32 个实施／支撑 Issue，共 40 项。

## 2. Epic 清单

| Epic | 模块 | P0 范围 | 子 Issue | 总工作量 | 目标周 |
|---|---|---|---:|---:|---|
| [#1 Foundation, authentication, roles, and shared states](https://github.com/Josscui516/MahjongFlow/issues/1) | Foundation & Auth | AUTH-01–05、PRIV-03 | 3 | 16 | Week 2 |
| [#2 Meeting records and decision capture](https://github.com/Josscui516/MahjongFlow/issues/2) | Meetings | MEET-01–05 | 3 | 13 | Week 3 |
| [#3 Convert meeting decisions into traceable tasks](https://github.com/Josscui516/MahjongFlow/issues/3) | Decision to Task | CONV-01–05 | 3 | 13 | Week 4 |
| [#4 Task management and Dashboard follow-up](https://github.com/Josscui516/MahjongFlow/issues/4) | Tasks & Dashboard | TASK-01–06 | 5 | 18 | Week 5 |
| [#5 Event management and preparation progress](https://github.com/Josscui516/MahjongFlow/issues/5) | Events | EVENT-01–05 | 3 | 12 | Week 6 |
| [#6 Privacy-minimised participant registration](https://github.com/Josscui516/MahjongFlow/issues/6) | Registration | REG-01–07、PRIV-01、02、04 | 4 | 16 | Week 6 |
| [#7 Secure QR and manual event check-in](https://github.com/Josscui516/MahjongFlow/issues/7) | Check-in | CHECKIN-01–07 | 5 | 26 | Week 7 |
| [#8 Attendance-based dinner eligibility verification](https://github.com/Josscui516/MahjongFlow/issues/8) | Dinner Verification | DINNER-01–04 | 3 | 11 | Week 7 |

## 3. 实施 Backlog

### 3.1 Foundation & Auth

| Issue | P0 ID | 验收场景 | Effort | Blocked by |
|---|---|---|---:|---|
| [#9 登录、登出、会话和受保护路由](https://github.com/Josscui516/MahjongFlow/issues/9) | AUTH-01、02 | X-01、02、03 | 5 | None |
| [#10 两级角色、服务端授权与 RLS](https://github.com/Josscui516/MahjongFlow/issues/10) | AUTH-03、04 | X-04、05、06 | 8 | #9 |
| [#11 共享 loading、empty、success 和 error 状态](https://github.com/Josscui516/MahjongFlow/issues/11) | AUTH-05 | X-07 | 3 | #9 |
| [#39 Schema、约束、seed 和生成类型](https://github.com/Josscui516/MahjongFlow/issues/39) | AUTH-03、04 支撑 | X-04–06 支撑 | 由 #10 汇总 | None |
| [#40 RLS policies 和服务端授权](https://github.com/Josscui516/MahjongFlow/issues/40) | AUTH-03、04 | X-04–06 | 由 #10 汇总 | #9、#39（集成） |
| [#41 M1 测试、质量和验收 harness](https://github.com/Josscui516/MahjongFlow/issues/41) | AUTH-01–05、PRIV-03 | X-01–07 | 支撑项 | #9、#11、#39、#40（集成） |

### 3.2 Meetings

| Issue | P0 ID | 验收场景 | Effort | Blocked by |
|---|---|---|---:|---|
| [#12 创建、查看和更新会议及基础字段](https://github.com/Josscui516/MahjongFlow/issues/12) | MEET-01、02 | M-01、02、05 | 5 | #10、#11 |
| [#13 讨论点与关键决策](https://github.com/Josscui516/MahjongFlow/issues/13) | MEET-03 | M-03 | 5 | #12 |
| [#14 会议历史与非破坏性边界](https://github.com/Josscui516/MahjongFlow/issues/14) | MEET-04、05 | M-04、05、06 | 3 | #12 |

### 3.3 Decision to Task

| Issue | P0 ID | 验收场景 | Effort | Blocked by |
|---|---|---|---:|---|
| [#23 从决策或讨论点创建任务并保留来源](https://github.com/Josscui516/MahjongFlow/issues/23) | CONV-01、02 | C-01、02、05 | 5 | #13、#15 |
| [#24 校验转换字段并限制单一负责人](https://github.com/Josscui516/MahjongFlow/issues/24) | CONV-03、05 | C-02、03、06 | 5 | #23、#10 |
| [#25 会议与来源任务双向导航](https://github.com/Josscui516/MahjongFlow/issues/25) | CONV-04 | C-04 | 3 | #23、#12 |

### 3.4 Tasks & Dashboard

| Issue | P0 ID | 验收场景 | Effort | Blocked by |
|---|---|---|---:|---|
| [#15 任务 CRUD 与状态约束](https://github.com/Josscui516/MahjongFlow/issues/15) | TASK-01、02 | T-01、02、08 | 5 | #10、#11 |
| [#16 悉尼日期的临期与逾期计算](https://github.com/Josscui516/MahjongFlow/issues/16) | TASK-03 | T-03、04 | 3 | #15 |
| [#20 负责人、状态、日期和活动筛选](https://github.com/Josscui516/MahjongFlow/issues/20) | TASK-04 | T-05 | 3 | #15、#17 |
| [#21 Dashboard 汇总](https://github.com/Josscui516/MahjongFlow/issues/21) | TASK-05 | T-06、08 | 5 | #16、#20、#19 |
| [#22 仅站内临期与逾期提醒](https://github.com/Josscui516/MahjongFlow/issues/22) | TASK-06 | T-07 | 2 | #16、#21 |

### 3.5 Events

| Issue | P0 ID | 验收场景 | Effort | Blocked by |
|---|---|---|---:|---|
| [#17 周常活动与比赛 CRUD](https://github.com/Josscui516/MahjongFlow/issues/17) | EVENT-01、02 | E-01、02、03、07 | 5 | #10、#11 |
| [#18 活动筹备任务与简单进度](https://github.com/Josscui516/MahjongFlow/issues/18) | EVENT-03、04 | E-04、05、T-05 | 5 | #17、#15 |
| [#19 即将到来的活动](https://github.com/Josscui516/MahjongFlow/issues/19) | EVENT-05 | E-06、07 | 2 | #17 |

### 3.6 Registration

| Issue | P0/隐私 ID | 验收场景 | Effort | Blocked by |
|---|---|---|---:|---|
| [#26 最小参与者身份字段](https://github.com/Josscui516/MahjongFlow/issues/26) | REG-01–03、PRIV-01、02 | R-01、02、06 | 5 | #10、#17 |
| [#27 报名状态与唯一约束](https://github.com/Josscui516/MahjongFlow/issues/27) | REG-04、06 | R-03、08 | 5 | #26 |
| [#28 隐私确认与报名／签到分离](https://github.com/Josscui516/MahjongFlow/issues/28) | REG-05、07 | R-04、05 | 3 | #27 |
| [#29 按活动清理虚构测试数据与保留规则](https://github.com/Josscui516/MahjongFlow/issues/29) | PRIV-04 | R-07 | 3 | #27 |

### 3.7 Check-in

| Issue | P0 ID | 验收场景 | Effort | Blocked by |
|---|---|---|---:|---|
| [#30 活动 token、URL、QR 与有效窗口](https://github.com/Josscui516/MahjongFlow/issues/30) | CHECKIN-01、02 | K-01、03 | 5 | #17 |
| [#31 服务端签到校验与原子防重复](https://github.com/Josscui516/MahjongFlow/issues/31) | CHECKIN-03、04 | K-02、03、04 | 8 | #30、#26、#10 |
| [#32 QR／人工签到元数据](https://github.com/Josscui516/MahjongFlow/issues/32) | CHECKIN-05 | K-05 | 3 | #31 |
| [#33 授权人工补签与更正](https://github.com/Josscui516/MahjongFlow/issues/33) | CHECKIN-06 | K-04、06 | 5 | #32、#10 |
| [#34 签到明细权限与安全聚合](https://github.com/Josscui516/MahjongFlow/issues/34) | CHECKIN-07 | K-07、08、X-05 | 5 | #32、#10 |

### 3.8 Dinner Verification

| Issue | P0 ID | 验收场景 | Effort | Blocked by |
|---|---|---|---:|---|
| [#35 从确认签到推导晚餐资格](https://github.com/Josscui516/MahjongFlow/issues/35) | DINNER-01、02 | D-01、02 | 3 | #32 |
| [#36 仅授权人员可见的核验页面](https://github.com/Josscui516/MahjongFlow/issues/36) | DINNER-03 | D-03 | 5 | #35、#10 |
| [#37 更正签到后重新计算资格](https://github.com/Josscui516/MahjongFlow/issues/37) | DINNER-04 | D-04 | 3 | #35、#33 |

## 4. 跨模块工程要求

每个实施 Issue 都明确要求：

- 持久化变更包含 timestamped migration、约束、索引、回滚／恢复说明和生成类型；
- 受保护数据在路由／UI、服务端和 Supabase RLS 三层执行访问控制；
- 为适用场景实现 loading、empty、success、validation error、
  permission denied、duplicate submit 和 system error；
- PR 关联 Issue 和验收场景 ID，并记录实际测试命令与结果；
- 开发、测试、截图和演示只使用虚构或匿名化数据，落实 PRIV-03；
- 未列入 P0 ID 的增强继续保留在 Post-MVP，不在 Issue 中静默扩展。

## 5. 覆盖审计

| 范围组 | 基线 ID 数量 | 已映射 | 结果 |
|---|---:|---:|---|
| AUTH | 5 | 5 | 通过 |
| MEET | 5 | 5 | 通过 |
| CONV | 5 | 5 | 通过 |
| TASK | 6 | 6 | 通过 |
| EVENT | 5 | 5 | 通过 |
| REG | 7 | 7 | 通过 |
| CHECKIN | 7 | 7 | 通过 |
| DINNER | 4 | 4 | 通过 |
| PRIV | 4 | 4 | 通过 |
| **合计** | **48** | **48** | **通过** |

自动审计结果：

- [x] 48/48 个 P0 与隐私基线 ID 至少映射到一个实施 Issue；
- [x] 32/32 个实施／支撑 Issue 包含可勾选验收条件和明确验证方式；
- [x] 32/32 个实施／支撑 Issue 具有正确的原生父级关系；
- [x] Day 2 原 29 个实施 Issue 的已识别依赖同时写入正文与 GitHub 原生 blocked-by 关系；#39–#41 的独立／集成依赖按 Week 2 冻结合同记录；
- [x] 8/8 个 epic 的 Day 2 子 Issue 拆分保持不变；#1 与 #10 仅增加 Week 2 支撑 sub-issues；
- [x] 40/40 个 Project Issue 均填写 Status、Priority、Module、Dependencies、
  Target Development Week、Backlog Rank、Story ID 和 Item Type；原 37 项保留
  Effort，三个新支撑 Issue 的 Effort 由 #10／Sprint planning 汇总，不重复计数；
- [x] Sprint 2 仅包含当前 Week 2 已批准范围 #9、#10、#39、#40、#11、#41；
- [x] 所有 Project Issue 当前均为 `Backlog` 与 `P0`。

## 6. 负责人处理

步骤 3 创建时没有足够依据把 29 个 Issue 分配给具体 GitHub 账号，因此没有
猜测人员与账号映射。步骤 8 曾把 #9–#37 临时统一分配给 `Josscui516`；
2026-08-07 已清除该批量分配，并按 Week 2 五个独立工作包只分配 #9、#39、
#40、#11、#41。其余未来工作继续未分配，等待对应 Sprint planning。

## 7. 第 4 步输入

第 4 步应在不改变本记录范围映射的前提下，根据价值、风险和原生
blocked-by 关系排序 Backlog。只有范围、依赖、验收条件和负责人均清晰的
近期 Issue 才能进入 `Ready`。
