# #35–#37：晚餐资格、授权核验与刷新

覆盖 DINNER-01–04 的 Yubo 消费方实现。2026-09-28 用户明确要求修复 Docker、补真实测试，并在现有 PR #87 一并完成 #36/#37；本次按该指示覆盖个人计划原有的分开 PR／逐项等待门禁。主要 Issue 仍为 #35，关联 #36、#37；不替代非作者审查或改变 Project 状态。

## 入口与数据边界

- `@/features/dinner-verification`：纯函数 `calculateDinnerEligibility(eventId, participantId, fact)`。同活动、同参与者的 confirmed 才是 Eligible；voided、缺失或不匹配为 Not Eligible Yet。报名本身不授予资格，人工现场确认无需额外报名。
- `@/features/dinner-verification/server`：`readDinnerEligibility` 返回最小单人结果；`readDinnerVerification` 返回最小名单和同一快照推导的资格人数。每次调用重新读取，不缓存资格。
- 唯一签到输入来自 `@/features/attendance/records/server` 的 `attendanceAuditService.listForEvent`，真实执行用户会话鉴权和 RLS；不导入私有 repository。
- 核验 DTO 仅有活动 ID／名称、参与者 ID／姓名／邮箱、资格、人数和读取时间。不包含学号、操作人、签到方式、完整审计行或可编辑资格。
- 列表展示有签到记录的人（含 voided），不是报名名单。没有签到记录的人不会出现，但其资格为 Not Eligible Yet；界面明确解释，不把搜索无匹配冒充某个身份的核验。
- UUID 统一小写；跨活动、无效参与者 ID、重复当前记录安全失败。权限／读取失败不转换为零人数或不符合资格。

## #36 页面与权限

`/dinner-verification` 提供授权活动选择，复用 events 公共入口；页面与 layout 分别鉴权，避免并行渲染绕过。`/dinner-verification/[eventId]` 提供核验、姓名／邮箱本地搜索、人数和空／错误状态。

`refreshDinnerVerification` Server Action 每次经过相同 authorised provider 与 RLS，直接 POST 也不能绕过。现有 proxy 已保护整个 namespace。committee、无后台 profile 的参与者会话及匿名访问均被拒绝；浏览器和真实测试覆盖页面、action、明细与底层敏感行。

共享导航及其他事件页挂载属于 Li / #34，本 PR 不改其文件；可直接进入本模块入口。没有 schema、migration、生成类型、RLS 或 seed 变更。

## #37 当前事实与陈旧视图

- 按钮可随时刷新；重新获得焦点／从隐藏恢复时自动重查，跨页面更正后返回即可读取当前事实。
- 刷新中禁用重复按钮，旧结果标为 Previous，提示等待后再发餐。60 秒未核验或离开页面后标记可能过期，要求成功刷新后再使用。
- 只接受最新请求结果，旧响应不能覆盖新响应。系统失败保留旧值但明确标记过期；权限／会话失效清除旧名单；成功时同时重算名单和人数。
- 不订阅或伪造 #33 的未发布 action，不反向修改人工签到模块。真实测试已通过 authorised JWT 更新／新增签到，并验证下一次读取与界面更新；这证明消费方链路，不等于 #33 人工 UI 全链路已完成。

## #32 合并后的边界修正

PR #88（Shiying / #32）已审阅并合入 Sprint 7，合并 SHA `dcdbcdb`。按用户允许“小问题记录后合并，再统一修正”的要求，本 PR 补了 provider exact-count 完整性检查及两条回归：PostgREST `max_rows = 1000` 截断时安全失败，避免遗漏人员被误判为未签到或汇总不完整。归属仍为 #32 输出合同。

没有实现大列表分页；超过上限时返回错误，由 provider 所有者后续扩展合同。

## #85 合并后的参数校验修正

2026-09-28 按用户相同审阅原则批准并合并 Li 的 #30 / PR #85，合并 SHA 为 `2c29a1b`。审阅时复跑原 head 的 628 个测试与 19 条 #30 数据库断言均通过，五项 CI 通过，无未解决审阅线程。当前分支已同步该 Sprint 基线。

记录的小问题是 `validateCheckInWindow` 对空值／缺字段／非字符串日期抛出 TypeError，无法返回安全 VALIDATION 结果，但不触发数据库写入。按用户授权在合并后统一修复：仅修改 tokens 的 validation 及两个局部测试文件，补运行时类型校验和 8 条回归；归属仍为 Li / #30，本次作为已授权的跨所有权后续修正纳入 PR #87，不改 migration 或有效日期行为。

## Docker 与本地环境

Docker Desktop 因遗留 AF_UNIX socket 无法启动。已备份 `Docker/run` 的运行时 socket，以及只含 `engine.sock` 的 `docker-secrets-engine` 目录，再启动 Desktop；未重置 Docker、删除卷或原有容器。备份命名含 `stale-sprint7` / `sprint7-backup`。

本地 MahjongFlow 栈位于 `http://127.0.0.1:45321`。保留数据，以 `supabase db push --local --yes` 补齐仓库已有 `20260827003049`、`20260908232400` 迁移，未新增迁移或修改远程库。

## 可复跑验证

在 Node 24 环境、仓库根运行：

```text
node node_modules/vitest/vitest.mjs run
node --test .github/scripts/run-database-tests.test.mjs
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node .github/scripts/run-database-tests.mjs
node src/features/dinner-verification/run-live-tests.mjs
node src/features/dinner-verification/run-live-tests.mjs --browser
```

runner 在内存读取本地 CLI 配置，只向测试子进程传递，不打印／保存凭据，拒绝远端地址。数据库测试仅替换 Next cookie/client 边界，真实运行生产授权、provider、Auth、PostgREST、触发器和 RLS。管理员 key 仅管理虚构 Auth 用户；表 fixture 用本地容器 postgres 建立／按本次 UUID 清理，更正测试和生产读取使用用户 JWT；不更改 service_role 权限。

浏览器脚本使用现有 Playwright；未安装在当前包时，用 `DINNER_PLAYWRIGHT_MODULE` 指向现有 `index.mjs`，不新增应用依赖。脚本构建 production 并启动 `127.0.0.1:4337`，完成后关闭本次 server、清理 fixture。`DINNER_EVIDENCE_DIR` 指定截图目录，默认忽略的 `tmp/dinner-evidence`。不写密码、session、storage-state 或网络 trace；Next 应用子进程不接收 fixture 管理员 key。

## 结果与交接

- 同步 #85 并修正参数校验后的全量 Vitest：729 通过、10 个 opt-in 跳过；其中本模块 7 个真实测试已另行显式运行通过，另外 3 个为已有 Sprint 5 套件。token 局部测试 15 个通过。
- 本模块纯规则、适配器、刷新、UI、路由：63 通过；真实 Auth／PostgREST／RLS：7 通过。
- 全量 SQL：14 文件、391 条断言通过；全量 ESLint、TypeScript、production webpack build 通过；数据库 runner 自测 5 个通过。
- 虚构浏览器截图与结果见 `evidence/`：桌面、390px 手机、键盘、搜索、空／无效活动、加载、旧值、刷新失败、真实更正、页面／action 拒绝及撤权。

分支 `codex/35-dinner-eligibility`，PR #87，base `sprint/7-qr-check-in-dinner`。Joshua 是唯一交接对象，负责非作者 review 和手动 Project 状态。

剩余：Shiying / #33 发布人工操作入口后，由 Yubo 与 Joshua 复跑人工 UI → 核验页面；共享导航由 Li / #34 接入。记录开始于 2026-09-28，下次团队检查建议为 2026-09-29 10:00（Sydney），未设置提醒。PR 保留 Draft，等待依赖联调及独立审查；不宣称 Issues 已进入 Testing/Done 或 Sprint 完成。

回退：回退本 PR 的 dinner 功能／路由及可独立回退的 provider 完整性检查。没有资格持久化或数据恢复步骤。
