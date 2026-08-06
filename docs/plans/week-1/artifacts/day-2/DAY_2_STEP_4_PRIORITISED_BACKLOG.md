# 第 2 天步骤 4：排序后的 P0 Backlog 与 Ready 决策记录

## 1. 执行结论

第 2 天步骤 4 已完成。已在
[MahjongFlow MVP GitHub Project](https://github.com/users/Josscui516/projects/5)
新增数值字段 `Backlog Rank`，并按共享基础、业务价值、原生依赖和数据风险
对 37 个 P0 Issue 完成 1–37 排序。

当前没有 Issue 移入 `Ready`。各实施 Issue 的范围、验收条件、内部依赖和
初始负责人已经明确，但第 3 天的数据模型、RLS 与权限基线以及第 4 天的
项目脚手架和开发环境尚未完成。为避免把未满足开始条件的工作提前承诺，
37 个 Issue 全部保留在 `Backlog`。

## 2. 排序原则

1. 认证、会话、角色、服务端授权、RLS 和共享状态优先，作为所有业务模块的共同基础；
2. 核心协调流程按会议记录、任务基础、决策转任务、任务跟进展开；
3. `#15` 和 `#16` 提前到决策转任务之前，是因为 `#23` 必须建立在可用的任务实体与状态规则上；
4. 活动、报名、签到和晚餐核验在核心协调流程之后，并保持各自的数据库、权限与验证工作同阶段交付；
5. 涉及保留规则和受控清理的 `#29` 放在 Week 8 集成阶段，不阻塞 Week 6 的报名主流程；
6. epic 排在其第一批实施 Issue 之前，用于表达阶段边界，不替代子 Issue 的独立验收。

## 3. 排序后的 Backlog

| Rank | Issue | 交付切片 | 目标周 | Blocked by |
|---:|---|---|---|---|
| 1 | [#1 Foundation, authentication, roles, and shared states](https://github.com/Josscui516/MahjongFlow/issues/1) | 共享基础 epic | Week 2 | None |
| 2 | [#9 登录、登出、会话和受保护路由](https://github.com/Josscui516/MahjongFlow/issues/9) | 认证入口 | Week 2 | None |
| 3 | [#10 两级角色、服务端授权与 RLS](https://github.com/Josscui516/MahjongFlow/issues/10) | 权限基础 | Week 2 | #9 |
| 4 | [#11 共享 loading、empty、success 和 error 状态](https://github.com/Josscui516/MahjongFlow/issues/11) | 共享反馈 | Week 2 | #9 |
| 5 | [#2 Meeting records and decision capture](https://github.com/Josscui516/MahjongFlow/issues/2) | 会议 epic | Week 3 | #1 |
| 6 | [#12 创建、查看和更新会议及基础字段](https://github.com/Josscui516/MahjongFlow/issues/12) | 会议基础 | Week 3 | #10、#11 |
| 7 | [#13 讨论点与关键决策](https://github.com/Josscui516/MahjongFlow/issues/13) | 决策来源 | Week 3 | #12 |
| 8 | [#14 会议历史与非破坏性边界](https://github.com/Josscui516/MahjongFlow/issues/14) | 会议历史 | Week 3 | #12 |
| 9 | [#4 Task management and Dashboard follow-up](https://github.com/Josscui516/MahjongFlow/issues/4) | 任务 epic | Week 5 | #1 |
| 10 | [#15 任务 CRUD 与状态约束](https://github.com/Josscui516/MahjongFlow/issues/15) | 任务基础 | Week 5 | #10、#11 |
| 11 | [#16 悉尼日期的临期与逾期计算](https://github.com/Josscui516/MahjongFlow/issues/16) | 到期规则 | Week 5 | #15 |
| 12 | [#3 Convert meeting decisions into traceable tasks](https://github.com/Josscui516/MahjongFlow/issues/3) | 决策转任务 epic | Week 4 | #2、#4 |
| 13 | [#23 从决策或讨论点创建任务并保留来源](https://github.com/Josscui516/MahjongFlow/issues/23) | 来源追踪 | Week 4 | #13、#15 |
| 14 | [#24 校验转换字段并限制单一负责人](https://github.com/Josscui516/MahjongFlow/issues/24) | 转换校验 | Week 4 | #23、#10 |
| 15 | [#25 会议与来源任务双向导航](https://github.com/Josscui516/MahjongFlow/issues/25) | 双向追踪 | Week 4 | #23、#12 |
| 16 | [#5 Event management and preparation progress](https://github.com/Josscui516/MahjongFlow/issues/5) | 活动 epic | Week 6 | #1、#4 |
| 17 | [#17 周常活动与比赛 CRUD](https://github.com/Josscui516/MahjongFlow/issues/17) | 活动基础 | Week 6 | #10、#11 |
| 18 | [#18 活动筹备任务与简单进度](https://github.com/Josscui516/MahjongFlow/issues/18) | 活动任务 | Week 6 | #17、#15 |
| 19 | [#19 即将到来的活动](https://github.com/Josscui516/MahjongFlow/issues/19) | 活动时间线 | Week 6 | #17 |
| 20 | [#20 负责人、状态、日期和活动筛选](https://github.com/Josscui516/MahjongFlow/issues/20) | 任务筛选 | Week 5 | #15、#17 |
| 21 | [#21 Dashboard 汇总](https://github.com/Josscui516/MahjongFlow/issues/21) | 协调汇总 | Week 5 | #16、#20、#19 |
| 22 | [#22 仅站内临期与逾期提醒](https://github.com/Josscui516/MahjongFlow/issues/22) | 任务提醒 | Week 5 | #16、#21 |
| 23 | [#6 Privacy-minimised participant registration](https://github.com/Josscui516/MahjongFlow/issues/6) | 报名 epic | Week 6 | #1、#5 |
| 24 | [#26 最小参与者身份字段](https://github.com/Josscui516/MahjongFlow/issues/26) | 数据最小化 | Week 6 | #10、#17 |
| 25 | [#27 报名状态与唯一约束](https://github.com/Josscui516/MahjongFlow/issues/27) | 报名一致性 | Week 6 | #26 |
| 26 | [#28 隐私确认与报名／签到分离](https://github.com/Josscui516/MahjongFlow/issues/28) | 隐私边界 | Week 6 | #27 |
| 27 | [#7 Secure QR and manual event check-in](https://github.com/Josscui516/MahjongFlow/issues/7) | 签到 epic | Week 7 | #1、#5、#6 |
| 28 | [#30 活动 token、URL、QR 与有效窗口](https://github.com/Josscui516/MahjongFlow/issues/30) | 签到入口 | Week 7 | #17 |
| 29 | [#31 服务端签到校验与原子防重复](https://github.com/Josscui516/MahjongFlow/issues/31) | 签到一致性 | Week 7 | #30、#26、#10 |
| 30 | [#32 QR／人工签到元数据](https://github.com/Josscui516/MahjongFlow/issues/32) | 签到审计 | Week 7 | #31 |
| 31 | [#33 授权人工补签与更正](https://github.com/Josscui516/MahjongFlow/issues/33) | 授权更正 | Week 7 | #32、#10 |
| 32 | [#34 签到明细权限与安全聚合](https://github.com/Josscui516/MahjongFlow/issues/34) | 敏感数据隔离 | Week 7 | #32、#10 |
| 33 | [#8 Attendance-based dinner eligibility verification](https://github.com/Josscui516/MahjongFlow/issues/8) | 晚餐核验 epic | Week 7 | #1、#7 |
| 34 | [#35 从确认签到推导晚餐资格](https://github.com/Josscui516/MahjongFlow/issues/35) | 资格推导 | Week 7 | #32 |
| 35 | [#36 仅授权人员可见的核验页面](https://github.com/Josscui516/MahjongFlow/issues/36) | 敏感核验 | Week 7 | #35、#10 |
| 36 | [#37 更正签到后重新计算资格](https://github.com/Josscui516/MahjongFlow/issues/37) | 实时一致性 | Week 7 | #35、#33 |
| 37 | [#29 按活动清理虚构测试数据与保留规则](https://github.com/Josscui516/MahjongFlow/issues/29) | 集成与保留规则 | Week 8 | #27 |

## 4. 并行工作流标记

已在仓库建立并应用以下标签。标签表示同一 Issue 内可以并行推进或联合评审的工程工作，不把数据库、权限或测试拆成容易遗漏的孤立任务。

| 标签 | Issue 数量 | 用途 |
|---|---:|---|
| `workstream:ui` | 23 | 页面、交互、状态反馈与可访问性 |
| `workstream:data-security` | 21 | schema、约束、RLS、服务端授权、隐私与数据一致性 |
| `workstream:test` | 29 | 所有实施 Issue 的验收、集成、权限或回归验证 |
| `risk:security-data` | 12 | 需要重点审查的认证授权、参与者数据、签到与晚餐核验 |

高风险标签覆盖 `#10`、`#26`、`#27`、`#29`、`#30`–`#37`。这些 Issue 的安全、数据和拒绝路径验证必须与功能实现处于同一交付阶段，不能顺延为独立收尾工作。

## 5. Ready 决策与进入门槛

本次状态结果为 `Backlog = 37`、`Ready = 0`。首批候选任务为 `#9`，但只有同时满足以下条件后才能移入 `Ready`：

- 第 3 天确认认证、角色、RLS、敏感数据与虚构测试数据基线；
- 第 4 天完成项目脚手架、Supabase 本地／开发环境和安全的环境变量约定；
- Issue 负责人已确认为 `Josscui516`，且没有第二个主要 Issue 同时处于
  `In Progress`；
- 验收场景、测试方式和外部依赖在开工前复核无歧义。

第 5 天选择首批开发任务时应重新执行上述门槛检查；满足后优先将 `#9` 移入 `Ready`，不得因为已有排序序号而跳过开始条件。

## 6. 验收审计

- [x] 37/37 个 Project Issue 具有唯一、连续的 `Backlog Rank`；
- [x] Project 实际位置顺序与 Rank 1–37 完全一致；
- [x] 所有实施 Issue 的已识别前置 Issue 均排在其之前；
- [x] 认证、数据库和权限基础先于依赖它们的业务模块；
- [x] 核心协调流程后再进入活动、报名、签到和晚餐核验；
- [x] 高风险数据与权限验证已在对应实施 Issue 中保留，并额外标记审查风险；
- [x] 29/29 个实施 Issue 已标记测试工作流；
- [x] 未满足外部开始条件的 Issue 没有提前进入 `Ready`；
- [x] 排序保持在批准的 P0 范围内，没有加入 P1 或 Post-MVP 功能。
