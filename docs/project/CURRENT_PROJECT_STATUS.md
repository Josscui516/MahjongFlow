# MahjongFlow 当前项目状态

> 2026-10-15 后续状态：用户已批准扫码报名／独立晚餐名册、Dashboard 合并、Docker 包装及 Task–Meeting 多对多补丁，并授权单个 PR 直接指向 `main`。补丁由 [#99](https://github.com/Josscui516/MahjongFlow/issues/99) 跟踪，交付记录见[补丁说明](POST_SPRINT_PATCH_DELIVERY.md)。以下 2026-09-30 状态仍为历史基线，不代表这些补丁已合并或部署。

核验日期：2026-09-30（Australia/Sydney）。本文件汇总实时交付结果；范围与成功标准仍以 [MVP 企划书](MVP_PROJECT_PROPOSAL.md)为准，历史计划与原测试记录保留其日期口径。

## 1. 当前交付基线

2026-09-30 实时复核：成员 PR [#95](https://github.com/Josscui516/MahjongFlow/pull/95) 已合入 `sprint/8-mvp-internal-acceptance`，Sprint 总 PR [#96](https://github.com/Josscui516/MahjongFlow/pull/96) 已合入 `main`，SHA `7e0c614b8a2f6e2bec06ab4df82cc2641858cdaa`。main 的 [Quality run 36673253441](https://github.com/Josscui516/MahjongFlow/actions/runs/36673253441) 五项全部成功；同 SHA 的 Vercel Production deployment `6752199649` 状态为 success。#94／#29 已关闭，Project 均 Done／Passed。非作者 PR 批准采用 Joshua 已明确授权的单次例外，未虚构 approval。

本地 main 与远程 main 的 SHA 一致。M5 已由 Joshua 确认完成；真人走查及团队内部审查资料由 Joshua 保管，不要求重新上传，也不编造人数、成功率或审查人。生产演示地址：[MahjongFlow](https://mahjong-flow.vercel.app)。本轮只读取部署状态，没有执行新部署或修改生产数据。

## 2. 已集成功能与证据

| 范围 | main 当前能力 | 证据 |
|---|---|---|
| 基础与认证 | committee／authorised、会话、受保护路由、RLS、独立账号管理能力 | [M1 验收](../plans/week-2/M1_ACCEPTANCE_RECORD.md) |
| US-01 | 会议、讨论点、决策、历史与持久化；删除受来源任务保护 | [会议验收](../plans/week-3/US_01_ACCEPTANCE_RECORD.md) |
| US-02 | 决策／讨论点转任务、单一负责人、双向来源导航 | [转换验收](../plans/week-4/US_02_ACCEPTANCE_RECORD.md) |
| US-03 | Sydney 日期、任务过滤、Dashboard、临期／逾期提示 | [跟进验收](../plans/week-5/TASK_FOLLOW_UP_ACCEPTANCE_RECORD.md) |
| US-04／05 | 活动与筹备进度、最小身份、授权报名、报名与签到分离 | [活动与报名验收](../plans/week-6/EVENTS_REGISTRATION_ACCEPTANCE_RECORD.md) |
| US-05／06 | QR／人工签到、原子去重、审计更正、分布式限速、签到推导资格与安全聚合 | [签到与晚餐验收](../plans/week-7/QR_CHECK_IN_DINNER_ACCEPTANCE_RECORD.md) |
| PRIV-04／M5 | 隔离虚构活动清理、备份与恢复、跨模块／权限／并发验收 | [M5 验收](../plans/week-8/MVP_INTERNAL_ACCEPTANCE_RECORD.md)、[维护 runbook](../operations/FICTIONAL_ACTIVITY_DATA_CLEANUP.md) |

应用测试、SQL、live 与浏览器结果引用各次原记录；本次文档同步未重跑产品测试。M5 全量记录为 861 passed／10 skipped，另 5 个脚本测试通过；验收子集和 live 检查不能重复加总。

## 3. GitHub Project 实时状态

[Project #5](https://github.com/users/Josscui516/projects/5) 共 43 个项目项，均为 Done；全部对应 Issue 已关闭。当前承诺视图为 Sprint 8，精确成员 #94／#29。Sprint 9 尚无成员或已批准的新计划，不预填负责人、Sprint 或开始状态。

Joshua 在本轮逐项确认 Sprint 3 #2／#12／#13／#14／#56 验收通过：同步 Issue checkbox 与 Gate 为 Passed，保留原 Done／closed，不制造历史 review。#1／#6／#44 保留 Not checked；其聚合 Gate 未获本轮确认。Done、Gate 和业务范围决定是不同记录。

当前 open Issues #62／#63／#64／#65 尚未纳入 Project。它们记录账号管理、密码设置、会议历史增强及永久删除的既有实现／范围协调；保持原归属和状态。公开自助报名、CSV、通知等新增能力没有本轮批准。

## 4. 后续交付门槛

| 项目 | 当前结论 | 负责人／下次检查 |
|---|---|---|
| S10／M6 | 当前部署成功不替代全新配置启动、正式演示环境验证及交接；尚未完成最终交付确认 | Joshua／2026-10-01 |
| 真实数据保留政策 | 虚构清理已交付；真实保留期限、责任、删除与备份待 Stakeholder 决定 | Joshua／2026-10-01 |
| #62–#65 | 保持 open；不能仅凭功能已上线推断范围／设计验收已完成 | Joshua／2026-10-01 |
| #1／#6／#44 聚合 Gate | Done／closed，但 Not checked；需逐项人工复核后更新 | Joshua／2026-10-01 |

不存在本轮确认的未解决阻断／严重产品缺陷；上述范围与交付门槛不等同于服务故障。后周计划需单独批准并遵循中文模板、所有权及 Sprint 流程。

## 5. 文档使用与核验边界

所有文档入口和历史／现行分类见 [完整文档索引](../DOCUMENTATION_INDEX.md)。仓库锁定 12 个 timestamped migrations；本轮不新增 schema、RLS 或生成类型。历史环境审计不代表今天重新核查 Vercel 变量、Supabase 远程 migration 或生产权限；相关运维记录明确保留该限制。
