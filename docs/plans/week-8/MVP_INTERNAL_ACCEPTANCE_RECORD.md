# MVP 内部工程验收记录

> 当前状态（2026-09-30）：Sprint 8 PR #95／#96 均已合并，main `7e0c614` 的 Quality 五项和 Vercel 部署成功；#94／#29 Done／Passed／closed。本文较早的“待 PR／合并／授权”描述属于执行过程，最终状态以本节更新及[当前项目状态](../../project/CURRENT_PROJECT_STATUS.md)为准。


验收人／收尾负责人：Joshua。日期：2026-09-30，Australia/Sydney。对应课程第 9 周（开发第 8 周），[本周计划](WEEK_8_IMPLEMENTATION_PLAN.md)、[MVP 企划书](../../project/MVP_PROJECT_PROPOSAL.md)。

## 1. 结论与证据边界

当前候选通过 S1–S8 的工程验证；本轮未发现未解决的阻断／严重产品缺陷。#29／PRIV-04 的虚构活动清理已在隔离数据库实现、验证备份和完整恢复。Joshua 后续授权通过 #94 与 `codex/94-m5-closeout` 提交推送本周交付物，Sprint 8 成员为 #94／#29；已通过成员 PR #95 与 Sprint 总 PR #96 合入 main，远程 Quality 五项及同 SHA 部署成功，#94／#29 Done／Passed／closed。

M5 **已完成（Joshua 确认，2026-09-30）**。Joshua 明确批准标记完成，并确认真人走查与独立审查已经和团队处理完毕，相关资料保存在其电脑中，无需 Codex 处理或要求补录。这一确认更新了此前“尚未开展”的状态。本记录引用 Joshua 的完成确认，不代填未提供的参与者数量、任务结果或审查人，也不将作者工程检查冒充独立审查。

M5 里程碑确认不等同于远程 Issue Done、PR 已批准／合并或 M6 正式交付。本周 Git 交付完成；范围协调与未确认的聚合 Gate 仍分别跟踪；S10 干净配置与正式演示环境启动将于开发第 9 周完成，本次候选生产构建成功不能替代 S10。

## 2. 版本与环境

- 源 `main`：`817c83fe7ce6156fa9a0b32e3b71dec51b82e330`，Sprint 7 总 PR #93 已合并。
- 当天读取 GitHub：Quality run `36662658372` 的 Lint／Typecheck／Test／Database／Build 全部成功，Vercel deployment 状态成功。属于已有基线，不是本周新增脚本的远程检查。
- 验收开始时读取 Project：Sprint 7 成员 #7、#8、#30–37 均 Done／Passed；当时 Sprint 8 无成员，#29 Backlog／Incomplete。后续按 Joshua 授权建立 #94 与 Sprint 8 成员 #94／#29，见[周计划](WEEK_8_IMPLEMENTATION_PLAN.md)。
- 本地隔离栈 `tmp/sprint7-db`，容器 `supabase_db_mahjongflow-issue33-sprint7`，API 46321、DB 46322；候选服务 localhost:3107。原用户栈和 `.env.local` 保留，未 reset 或写生产。
- Chrome 桌面与 390 × 844 iframe 中的实际应用验证。浏览器 viewport override 未生效，因此使用[独立窄屏容器](../../../tests/fixtures/check-in-dinner/week8-responsive-preview.mjs)，没有新增产品路由。
- 数据全部来自虚构 fixture／本地 UI 新建；截图无 token、密码和真实参与者信息。原始本地日志位于忽略的 `tmp/`，不提交运行时环境／链接。
- 验收结束已停止本次 localhost:3107／3128 服务及命名隔离栈，保留其虚构数据；原用户 Supabase 栈未停止。重启命令见[演示交接](DEMO_AND_HANDOFF.md)。

## 3. 验收矩阵

| 标准 | 本次证据与结果 | 结论 |
|---|---|---|
| S1 会议记录 | Chrome 新建会议、增加决策、重开详情；会议 CRUD／删除／关系 SQL 与自动化回归通过 | 工程通过 |
| S2 决策转任务 | UI 转换，任务保留原会议与决策链接，刷新仍存在 | 工程通过 |
| S3 负责人／截止／状态 | UI 指派、Sydney 昨日截止显示 overdue 1 day，完成状态持久化；日期边界自动化通过 | 工程通过 |
| S4 Dashboard | live 3 场景通过；Chrome 任务完成后不再出现在未完成／逾期列表，近期活动可见 | 工程通过 |
| S5 活动关系 | 活动关联真实 UI 任务、报名和签到；报名 1／签到 2 可区分，完成进度 1/1 | 工程通过 |
| S6 签到唯一性 | UI 同链接重试 Already processed；HTTP 并发仅一行；人工／QR 竞争及更正 CAS 回归通过 | 工程通过 |
| S7 角色权限 | committee 只见安全聚合，敏感三路由拒绝；匿名跳登录、outsider 拒绝；SQL RLS 与服务检查通过 | 工程通过 |
| S8 晚餐资格 | 报名未签到不获资格；QR 作废后 Not Eligible Yet，未报名但已人工签到者 Eligible；恢复后 2/2；live 7 场景通过 | 工程通过 |
| S9 真人可用性 | Joshua 确认团队已完成走查，详细资料由其在电脑中保存；本仓库保留[原任务卡](TARGET_USER_WALKTHROUGH.md) | 已完成（Joshua 确认）；不代填数量或计算成功率 |
| S10 干净配置启动 | 本次 Next 生产构建及本地 start 成功；已有 main 部署状态成功；本次未重做全新安装／正式交接 | 部分证据，待开发第 9 周 |

## 4. 实际执行的自动化与数据库检查

以下均退出 0。验收子集与全量测试重叠，禁止相加宣称独立用例总数。

| 命令／隔离方式 | 实际结果 | 本地原始日志 |
|---|---|---|
| `npm test` | 131 文件通过、2 跳过；861 测试通过、10 跳过；另 5 个脚本测试通过 | `tmp/week8-baseline-tests.log` |
| `npm run test:acceptance` | 22 文件通过、1 跳过；151 测试通过、3 跳过 | `tmp/week8-acceptance.log` |
| `npm run lint`／`npm run typecheck` | 全部通过；新增脚本完成后再跑 lint 通过 | `tmp/week8-final-lint.log`／`tmp/week8-typecheck.log` |
| `$env:SUPABASE_WORKDIR='tmp/sprint7-db'; npm run db:test` | 17 SQL 文件、447 断言通过；各文件事务回滚 | `tmp/week8-database.log` |
| 同上 workdir，`npm run db:test:concurrency` | registration 18、RLS 9 断言通过 | `tmp/week8-concurrency.log` |
| `node tests/integration/attendance/manual/database-concurrency.mjs supabase_db_mahjongflow-issue33-sprint7` | 人工先／QR 先／并发更正／恢复 4 场景通过 | `tmp/week8-attendance-races.log` |
| `node src/features/dinner-verification/run-live-tests.mjs --workdir tmp/sprint7-db` | 7 live 场景通过，涉及无权限、有效／作废签到和纯推导 | `tmp/week8-dinner-live.log` |
| S5 local-runtime 隔离适配副本 `tmp/week8-s5-runtime.cjs` 的 `test` | 3 个 opt-in live 测试通过；只改临时副本 workdir、容器、API 和 runtime 路径 | `tmp/week8-s5-live.log` |
| `node tests/integration/registrations/fictional-cleanup.mjs` | 5 组成功／失败／权限／活动隔离／完整恢复检查通过 | `tmp/week8-cleanup.log` |
| `node tests/fixtures/check-in-dinner/local-runtime.mjs verify-http` | no-store、最小响应、并发唯一、作废重试、非法输入、429 与撤销通过 | `tmp/week8-http.log` |
| 同脚本 `verify-rollback` | 事务内撤销公开写权限保留全部签到行，rollback 恢复 grants | `tmp/week8-rollback.log` |
| `node node_modules/supabase/dist/supabase.js db lint --local --fail-on error --workdir D:/joshu/Documents/Projects/MahjongFlow/tmp/sprint7-db` | 无 schema lint 错误 | `tmp/week8-db-lint.log` |
| 同 CLI `db diff --local --workdir D:/joshu/Documents/Projects/MahjongFlow/tmp/sprint7-db` | 无 schema drift；relative workdir 工具失败已改绝对路径复验 | `tmp/week8-db-diff.log` |
| `node tests/fixtures/check-in-dinner/local-runtime.mjs build` | 当前安装版默认生产构建成功 | `tmp/week8-build.log` |

全量默认测试跳过项为 opt-in live／环境相关项。本轮另执行上述 dinner 和 S5 live，但不把它们说成默认测试零跳过。schema／RLS 未修改，不新增 migration，不手工修改或声称重新生成数据库类型。

最终文档相对链接全部有效，`git diff --check` 通过。当前 `.next/static` 的 57 个文件均未包含隔离栈实际 service-role／secret key 值；仅在进程内比较，没有打印值。这是当前值的精确检查，不是全面密钥／依赖漏洞扫描。可提交的无敏感值检查摘要见[最终检查](evidence/FINAL_CHECKS.txt)。

## 5. Chrome 完整流程与证据

1. authorised 创建 `Fictional Week 8 End-to-End Meeting`，添加决策，转换为分配给自己的 `Fictional Week 8 Venue Task`，截止 2026-09-29；刷新保留来源和逾期。[任务来源截图](evidence/task-source-desktop.png)。
2. 新建 `Fictional Week 8 Full Workflow Event`，Sydney 2026-09-30 18:30，关联任务，进度 0/1。授权登记虚构参与者，报名 1、签到 0。[签到前截图](evidence/registration-before-checkin.png)。
3. 设置当日签到窗口，生成 QR；从实际 QR 图像解码与一次性链接比对一致。退出后台后用公开入口签到成功，重试 Already processed。[成功截图](evidence/public-checkin-success.png)。URL token 没有存入文档或截图。
4. 重新登录，QR 行记录自助方法及时间；人工加入未报名的虚构 walk-in，报名 1、有效签到 2。作废 QR 后，有效签到 1；晚餐仅 walk-in Eligible，QR Not Eligible Yet。[更正后资格](evidence/dinner-after-correction.png)。
5. 窄屏以 Space 确认、Enter 恢复 QR 行，方法／原始签到时间保留，更正操作人及时间更新。晚餐刷新后 Eligible 2/2。[窄屏签到](evidence/attendance-mobile.png)、[窄屏资格](evidence/dinner-mobile.png)。
6. 完成任务，活动进度 1/1；Dashboard 自己未完成任务为 0，完成项离开逾期／未完成列表。[Dashboard](evidence/dashboard-completed.png)。
7. committee 登录后只显示报名 1／签到 2，未显示人员、token 管理或敏感入口；直接访问 registrations／attendance／dinner 均拒绝。[安全聚合](evidence/committee-safe-event.png)、[拒绝访问](evidence/committee-denied.png)。匿名直接访问签到明细跳登录；Auth outsider 无有效业务资料仍拒绝，登录页可进入。
8. meeting、task、event、registration、attendance、dinner、dashboard 窄屏完成加载后，应用 html `clientWidth=scrollWidth=375`，无横向溢出。[窄屏 Dashboard](evidence/dashboard-mobile.png)。390 外框包含滚动条；该方式验证 CSS 窄屏布局，未模拟移动设备触控／真实硬件。
9. 键盘 Skip to main content 的 Enter 将焦点移至 `MAIN#main-content`。状态同时有文字；表单校验、loading／empty／error／duplicate 等由自动化与上述 UI 路径覆盖，本轮未逐页人工诱发每一种系统故障，不宣称完整无障碍认证。
10. 完成后撤销本活动 token：UI No active token、按钮禁用；旧公开页刷新 Check-in unavailable；报名／签到统计仍 1／2。[收尾截图](evidence/event-finished-token-revoked.png)。

可重新打开的虚构资源 UUID：会议 `c54fa167-e68c-461c-b10f-54330a294084`、任务 `7a60bdd6-27d1-4a4f-947b-88bf23abb7d3`、活动 `54bc4299-5e88-4035-907c-38ce8a3a04b2`。这些不是生产记录。

## 6. 隐私、清理与剩余门槛

#29 本地维护脚本默认只预览，目标名／UUID／虚构身份校验、固定隔离容器、先备份、锁定后快照比对、事务清理；目标 A 报名／签到删除，活动 B 逐行不变、共享身份和活动保留，完整恢复审计字段。anon／authenticated 直接 DELETE 拒绝。入口不增加应用角色权限，正式保留期限待 Stakeholder 确认。见[维护流程](../../operations/FICTIONAL_ACTIVITY_DATA_CLEANUP.md)。

真人走查与独立审查已由团队完成并由 Joshua 保管资料，不列为待补录项。其他后续为 #62–#65 范围协调、#1／#6／#44 聚合 Gate 与 #6 checklist、真实保留政策及 S10／M6；Sprint 3 Gate 和 Sprint 8 PR／合并交付已完成，见[缺陷与决定](DEFECTS_AND_DECISIONS.md)。本记录区分作者工程自验和 Joshua 后续里程碑确认，不据此自动改变 Project Passed 或 PR review 状态。

## 最终交付同步（2026-09-30）

2026-09-30 实时复核：成员 PR [#95](https://github.com/Josscui516/MahjongFlow/pull/95) 已合入 `sprint/8-mvp-internal-acceptance`，Sprint 总 PR [#96](https://github.com/Josscui516/MahjongFlow/pull/96) 已合入 `main`，SHA `7e0c614b8a2f6e2bec06ab4df82cc2641858cdaa`。main 的 [Quality run 36673253441](https://github.com/Josscui516/MahjongFlow/actions/runs/36673253441) 五项全部成功；同 SHA 的 Vercel Production deployment `6752199649` 状态为 success。#94／#29 已关闭，Project 均 Done／Passed。非作者 PR 批准采用 Joshua 已明确授权的单次例外，未虚构 approval。

Joshua 在本轮确认 Sprint 3 五项历史验收全部通过，已同步 Gate；M5 和本周 Git 交付均完成。S10／M6、真实保留政策及 #62–#65 仍为后续输入；#6 已 closed／Done，聚合 Gate 保留 Not checked，不再作为等待 #29 的未交付项。历史测试数量与原始记录不修改。
