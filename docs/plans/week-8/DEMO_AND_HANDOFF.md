# 开发第 8 周演示与交接

负责人 Joshua；版本与结果见[内部验收记录](MVP_INTERNAL_ACCEPTANCE_RECORD.md)。仅使用虚构数据，禁止向观众展示环境值、token 明文、终端 status 输出或真实参与者。演示不是 S9 真人测试结果。

## 1. 本地启动与停止

在仓库根目录执行。命名隔离目录须已存在，不能以默认栈替代；重建方法见 [Sprint 7 隔离环境说明](../week-7/QR_CHECK_IN_DINNER_ACCEPTANCE_RECORD.md#3-执行环境与命令)中的 config／migration／seed 复制、project_id 和端口修改步骤，配合[环境配置](../../operations/ENVIRONMENT_CONFIGURATION.md)与[migration runbook](../../operations/DATABASE_MIGRATIONS.md)。不要为了演示 reset 原用户数据卷。

```powershell
# 终端 A：启动已配置的隔离数据库，输出仅留本地忽略目录
node node_modules/supabase/dist/supabase.js start --workdir D:/joshu/Documents/Projects/MahjongFlow/tmp/sprint7-db -x vector *> tmp/week8-start-private.log
# 构建候选；从 CLI 内存传入本地配置，不改 .env.local
node tests/fixtures/check-in-dinner/local-runtime.mjs build
# 终端 B：启动本地生产模式候选，Ctrl+C 停止本终端
node tests/fixtures/check-in-dinner/local-runtime.mjs start
```

访问 `http://localhost:3107`。fixture 账号为 `sprint7.authorised@example.test`、`sprint7.committee@example.test`；密码通过本地私密渠道提供，不入文档。需要重新建立 fixture 时，在私密终端设置本地专用 `SPRINT7_FIXTURE_PASSWORD` 后运行 `node tests/fixtures/check-in-dinner/local-runtime.mjs setup`，之后移除环境变量；不得使用真实账号密码。

```powershell
# 终端 C：可选窄屏预览；Ctrl+C 停止本终端
node tests/fixtures/check-in-dinner/week8-responsive-preview.mjs 54bc4299-5e88-4035-907c-38ce8a3a04b2 7a60bdd6-27d1-4a4f-947b-88bf23abb7d3 c54fa167-e68c-461c-b10f-54330a294084
# 关闭服务终端后，只停止命名隔离栈；保留其虚构数据供后续验收
node node_modules/supabase/dist/supabase.js stop --workdir D:/joshu/Documents/Projects/MahjongFlow/tmp/sprint7-db
```

预览地址 `http://localhost:3128/?page=dinner`，page 可为 meeting／task／event／registration／attendance／dashboard。它只是 iframe 容器，应用仍执行自己的登录和权限。

## 2. 约 8–10 分钟演示顺序

| 顺序 | 操作与输入 | 观众可核对的结果 |
|---|---|---|
| 1 | authorised 新建带 `Fictional ` 前缀的会议、添加明确决策 | 重开后有持久化记录 |
| 2 | 将决策转为一个负责人任务，截止设为 Sydney 昨日 | 原会议／决策链接，逾期文字及日期 |
| 3 | 新建虚构活动，关联此任务 | 筹备进度 0/1；活动日期使用 Sydney |
| 4 | 登记一个全新 `@example.test` 虚构参与者 | 报名 1、签到 0；晚餐尚未 Eligible |
| 5 | 设置当前有效签到窗口，生成一次性活动 QR，在另一窗口退出后台后签到 | Success；再次提交 Already processed，仅一行 |
| 6 | 授权人员人工签到一名未报名 walk-in | 报名与签到独立；签到 2，方法与审计清楚 |
| 7 | 作废 QR 行并查看晚餐，再恢复后刷新 | 资格 1/2→2/2，由有效签到推导 |
| 8 | 完成筹备任务、查看活动与 Dashboard | 进度 1/1、任务离开未完成和逾期列表 |
| 9 | committee 登录活动，尝试明细深链接 | 安全聚合可见、人员与资格明细拒绝 |
| 10 | authorised 撤销 token；旧公开页刷新 | Unavailable；签到历史保留 |

既有本周链路已处于“任务完成、签到 2、token 撤销”的收尾状态，可用于静态说明；要重演创建／首次签到，另建一组虚构资源，不伪造旧记录或复用已签到者来展示首次成功。演示结束撤销链接，不把一次性链接放入报告／截图。

## 3. 真人走查与验收交接

Joshua 已确认真人走查和独立审查已与团队处理完毕，资料保存在电脑中，M5 已按其确认标记完成，无需 Codex 处理或要求补录。见[验收记录](MVP_INTERNAL_ACCEPTANCE_RECORD.md)；[目标用户任务卡](TARGET_USER_WALKTHROUGH.md)保留供未来复用，不代填详细结果。

交给非作者一次集中审查：完整 diff、[清理 runbook](../../operations/FICTIONAL_ACTIVITY_DATA_CLEANUP.md)、清理回归、[验收记录](MVP_INTERNAL_ACCEPTANCE_RECORD.md)与截图。Joshua 单人实现不取消非作者 review，审查不能由本记录代替。必要时复验新缺陷，不用无关功能扩展填充本周。

## 4. 开发第 9 周输入与未完成项

功能／schema 周初冻结，重复干净安装、顺序 migration／seed、环境变量安全、正式演示启动和部署回退；重跑受影响回归，完成 README／用户说明／隐私与交接。确认真实数据保留政策和范围决定，批准前不将必须 P0 默默转 Post-MVP。

Joshua 已授权本周 GitHub 状态、分支、提交与推送；主 Issue #94、纳入 #29，实时 Project Sprint 8 成员与两者一致。交付分支 `codex/94-m5-closeout`，目标 `sprint/8-mvp-internal-acceptance`。后续 PR 创建尚未授权；PR review、required checks、Testing、合并和部署分别保留门禁。详细负责人、所需帮助与下次检查见[缺陷／待决事项](DEFECTS_AND_DECISIONS.md)。
