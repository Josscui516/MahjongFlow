# 开发第 8 周缺陷、范围与待决事项

> 当前状态（2026-09-30）：Sprint 8 PR #95／#96 均已合并，main `7e0c614` 的 Quality 五项和 Vercel 部署成功；#94／#29 Done／Passed／closed。本文较早的“待 PR／合并／授权”描述属于执行过程，最终状态以本节更新及[当前项目状态](../../project/CURRENT_PROJECT_STATUS.md)为准。


负责人 Joshua。2026-09-30（Australia/Sydney）。本周由用户批准单人实施、同一工作包顺序收尾；后续已明确授权本周 GitHub 状态、Issue／Sprint 路线、分支、提交及推送，后续已明确授权 PR 创建与 main 合并，并给予本次独立 review 例外；PR #95／#96 已完成交付，部署由既有集成产生。

## 1. 分级与处理

阻断：核心流程不可完成、安全绕过、数据丢失；严重：重复签到、错误资格、关系破坏、关键角色拒绝失效。一般／轻微：不阻断核心任务的交互、文案和局部布局。该分级独立于需求范围 P0/P1。

| ID | 类型／归属 | 处理与复验 | 状态 |
|---|---|---|---|
| W8-D01 | #29／PRIV-04 未交付维护流程 | 加入隔离栈维护脚本、备份／快照保护、活动隔离与恢复回归、runbook；真实 DB 回归通过 | 已由 PR #95／#96 交付至 main，#29 Done／Passed／closed |
| W8-T01 | 测试工具：CLI relative workdir 的 shadow 子进程找不到目录 | 改用完整绝对 workdir 执行 db diff；结果为空，无产品代码改动 | 已解决 |
| W8-T02 | 测试工具：Chrome locator 对原生 datetime-local 未成功赋值 | 改用 Chrome AX date field 原生 setValue，创建会议成功；不把工具失败认定为产品缺陷 | 已解决 |

验收中发现的产品阻断／严重问题按证据新增；不能据这张初始表推断所有测试已完成。最终结论见[验收记录](MVP_INTERNAL_ACCEPTANCE_RECORD.md)。

## 2. 范围协调与人工门槛

| 项目 | 当前证据／影响 | 所需后续／最终结果 | 负责人／下次检查 |
|---|---|---|---|
| #62／#63／#65 | 当前 P0 文档含账号生命周期、密码设置与永久删除；历史 Issue 仍 Post-MVP 协调且 open | 核对已批准范围决定／设计与交付证据，得到正式记录后再授权同步 GitHub；本周不新增这些功能或擅自关闭 | Joshua／2026-10-01 |
| Sprint 3 Acceptance Gate | #2/#12/#13/#14/#56 原 Gate Incomplete；本轮 Joshua 逐项确认后均 Done／Passed／closed | Joshua 本轮逐项确认全部验收通过，checkbox／Gate 已手动同步 Passed；不伪造历史 review | Joshua／2026-10-01 |
| #6 父 Epic | #26–29 已 Done／Passed／closed；父项 #6 已 Done／closed，Gate 为 Not checked，正文子项 checklist 仍未核对 | 后续逐项核对父项 checkbox 与聚合 Gate；本轮不补父项 Passed | Joshua／2026-10-01 |
| S9／独立审查 | Joshua 确认两项已和团队处理完毕，资料保存在电脑中，批准 M5 完成 | 已完成，由 Joshua 保管资料；不要求向 Codex 提供或补录，不代填详细结果 | Joshua／已收口 |
| 真实数据保留政策 | 当前范围明确待 Stakeholder 决定 | 最终评审确认期限、负责人、删除及备份；虚构演示可继续 | Joshua／2026-10-01 |
| Sprint 8 Git 路线 | 主 Issue #94，纳入 #29，实时 Sprint 8 集合一致；用户已授权建立分支、提交与推送 | 成员 PR #95 至 sprint/8-mvp-internal-acceptance、Sprint PR #96 至 main 均已合并；#94／#29 Done／Passed／closed | Joshua／2026-10-01 |

以上不等同于服务运行故障。需要的帮助分别为用户证据、范围决定、独立审查或明确 GitHub／Git 授权；不会发消息联系他人或自动改变状态。未确认项保留后周门槛，不能把必须 P0 默默降级成 Post-MVP。

## 3. M5 完成确认

2026-09-30 Joshua 明确表示“M5可以标记完成了”，确认真人走查和独立审查已完成，并进一步说明已与团队处理完毕、资料保存在电脑中、不需要 Codex 处理。据此将本地 M5 标记完成，详细资料由 Joshua 保管，不再要求补录。本确认不关闭 #29／#6、不改历史 Acceptance Gate、不表示本周文件已经合并／部署，也不豁免后续 Git 交付的实际 review 与检查。

## 4. 本次 PR 审查例外

Joshua 随后明确授权“创建 PR 并合并到 main，不需要他人审核”。因此本次非作者 GitHub 批准不再是门槛；该例外不等于历史团队资料中的审查是 GitHub approval，也不改变其他 Sprint 的规则。两级 PR、实时 Sprint 成员、五项质量检查及 review threads／阻断问题仍须核对；通过后合并，不修改仓库全局分支保护。

## 最终交付同步（2026-09-30）

2026-09-30 实时复核：成员 PR [#95](https://github.com/Josscui516/MahjongFlow/pull/95) 已合入 `sprint/8-mvp-internal-acceptance`，Sprint 总 PR [#96](https://github.com/Josscui516/MahjongFlow/pull/96) 已合入 `main`，SHA `7e0c614b8a2f6e2bec06ab4df82cc2641858cdaa`。main 的 [Quality run 36673253441](https://github.com/Josscui516/MahjongFlow/actions/runs/36673253441) 五项全部成功；同 SHA 的 Vercel Production deployment `6752199649` 状态为 success。#94／#29 已关闭，Project 均 Done／Passed。非作者 PR 批准采用 Joshua 已明确授权的单次例外，未虚构 approval。

Joshua 在本轮确认 Sprint 3 五项历史验收全部通过，已同步 Gate；M5 和本周 Git 交付均完成。S10／M6、真实保留政策及 #62–#65 仍为后续输入；#6 已 closed／Done，聚合 Gate 保留 Not checked，不再作为等待 #29 的未交付项。历史测试数量与原始记录不修改。
