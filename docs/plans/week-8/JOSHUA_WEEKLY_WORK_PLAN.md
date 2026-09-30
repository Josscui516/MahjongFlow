# Joshua：开发第 8 周收尾工作文档

> 当前状态（2026-09-30）：Sprint 8 PR #95／#96 均已合并，main `7e0c614` 的 Quality 五项和 Vercel 部署成功；#94／#29 Done／Passed／closed。本文较早的“待 PR／合并／授权”描述属于执行过程，最终状态以本节更新及[当前项目状态](../../project/CURRENT_PROJECT_STATUS.md)为准。


所属：[统一周计划](WEEK_8_IMPLEMENTATION_PLAN.md)。唯一实施负责人 Joshua（Josscui516）。本周用户明确授权单人收尾，不设置其他成员开发包。

## 1. 目标与开始条件

完成 M5 工程验收和 #29，形成能被独立审查人复验的候选交付。起点是 Sprint 7 main `817c83f`；工作树初始干净，代码、迁移和现有 fixtures 已集成。需要 Node 24、Docker、本地专用 Supabase 和 Chrome；真人走查与远程交付授权分别留为门槛。

## 2. 独立范围与文件所有权

本周所有新文件、维护脚本、清理回归、README 当前状态及确证缺陷的最小修复由 Joshua 拥有。禁止无关重构、生产 reset／seed、真实数据查询、环境值改写及历史验收结论覆盖。身份、活动、token、资格和来源合同遵循当前权威文档。

## 3. 输入、输出与交接对象

输入：现有模块、PR #93、真实 GitHub 状态和本地虚构 fixture。输出：清理 runbook、成功／失败回归、全链验收、用户走查任务卡、缺陷分级和演示交接。唯一收尾交接对象为 Joshua；非作者审查人由 Joshua 指定，不虚构姓名或批准。

## 4. 顺序执行

先固定 SHA 和需求矩阵；再完成 R-07 安全维护与恢复；随后跑自动化／真实 DB／并发／HTTP，构建后在 Chrome 验收全链、窄屏和键盘；组织真人走查，修复并复验；最后更新文档和待交付门槛。每步的实际结果集中写入[验收记录](MVP_INTERNAL_ACCEPTANCE_RECORD.md)，不复制历史测试为本周新运行。

## 5. 验证与完成定义

必须证明活动隔离、源关系、唯一性、角色拒绝和当前资格；所有 live opt-in 明确执行或保留限制。新文档相对链接和 diff 检查通过。工程验证、S9、范围批准、非作者 review、合并／部署分别判定；后四者缺失不能写“本周全部完成”。

## 6. 风险与未完成项

M5 已由 Joshua 确认完成；真人走查和独立审查已由团队处理，资料由 Joshua 保存在电脑中，不列为待补录项。本周提交推送已授权，主 Issue #94、纳入 #29，交付分支 codex/94-m5-closeout 基于 sprint/8-mvp-internal-acceptance。#62–#65 范围协调、#1／#6／#44 聚合 Gate 和 S10／M6 继续单独跟踪；Sprint 3 五项 Gate、本周 PR／合并已完成，Joshua 负责推动，2026-10-01（Sydney）复查。缺陷立即记录，有安全／数据风险不等到下周。具体状态以验收记录为准。

## 最终交付同步（2026-09-30）

2026-09-30 实时复核：成员 PR [#95](https://github.com/Josscui516/MahjongFlow/pull/95) 已合入 `sprint/8-mvp-internal-acceptance`，Sprint 总 PR [#96](https://github.com/Josscui516/MahjongFlow/pull/96) 已合入 `main`，SHA `7e0c614b8a2f6e2bec06ab4df82cc2641858cdaa`。main 的 [Quality run 36673253441](https://github.com/Josscui516/MahjongFlow/actions/runs/36673253441) 五项全部成功；同 SHA 的 Vercel Production deployment `6752199649` 状态为 success。#94／#29 已关闭，Project 均 Done／Passed。非作者 PR 批准采用 Joshua 已明确授权的单次例外，未虚构 approval。

Joshua 在本轮确认 Sprint 3 五项历史验收全部通过，已同步 Gate；M5 和本周 Git 交付均完成。S10／M6、真实保留政策及 #62–#65 仍为后续输入；#6 已 closed／Done，聚合 Gate 保留 Not checked，不再作为等待 #29 的未交付项。历史测试数量与原始记录不修改。
