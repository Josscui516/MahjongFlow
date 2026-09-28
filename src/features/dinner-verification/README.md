# #35：晚餐资格推导与签到接口接入

本模块实现 DINNER-01/02 的纯计算，以及消费 #32 公共接口的 server-only 读取适配器。不保存资格、不提供资格写接口、不新增个人属性。

## 公共入口与边界

- `@/features/dinner-verification`：`calculateDinnerEligibility(eventId, participantId, fact)`。同活动、同参与者、confirmed 才为 `Eligible`；voided、缺失或不匹配为 `Not Eligible Yet`。报名本身不授予资格，人工确认签到不额外要求报名。
- `@/features/dinner-verification/server`：`readDinnerEligibility(eventId, participantId)`。调用 `@/features/attendance/records/server` 的真实 `attendanceAuditService.listForEvent`，由 provider 执行用户会话鉴权和 RLS。只返回活动、参与者 ID 和资格，不转发姓名、邮箱或审计字段。
- 适配器将 provider 的 `status` 映射为纯函数的 `attendanceStatus`，统一 UUID 大小写，拒绝跨活动或重复当前记录。授权／查询失败保留安全错误，绝不转换为“暂不符合资格”。每次调用重新读取，不缓存结果。
- `createDinnerEligibilityReader` 仅作为测试注入边界；生产入口始终使用真实 provider，不导入其内部 repository。
- 无页面、公开 endpoint 或 Server Action。#36 页面和 #37 人工操作后的刷新仍需按顺序交付；当前更正事实测试不等于完成 #33/#37 界面流程。

## #32 审阅及合并后的边界修正

2026-09-28 已审阅 #32 / PR #88 的 `33fe42a`，28 个针对性测试通过，五项 CI（含数据库和 Build）通过，无未解决 review thread；已批准并合入 Sprint 7，合并 SHA 为 `dcdbcdb`。QR 新写入流程联调由 #31/#32 负责，路由挂载／视觉验收由 #34 负责；成员合并不是 Sprint 完成证明。

按用户“记录小问题、合并后统一修正”的指示，接入时补充 provider 列表完整性检查：仓库配置 `api.max_rows = 1000`，单次读取可能被 PostgREST 截断。查询增加 exact count；若 count 缺失或与返回行数不同，返回安全系统错误，避免把截断后缺失的参与者误判为未签到。仅修改 #32 的 `repository.ts` 及其局部测试，归属仍为 #32/Shiying 的输出完整性合同，本次作为 #35 集成所需的已授权后续修正。新增两条回归测试。

该保护不实现大列表分页；超过 API 行数上限时会明确失败，不能作为完整名单使用。将来需要扩大列表容量时，由 provider 所有者扩展读取合同。

## Schema 与权限

沿用已有 `attendance_records`、confirmed/voided 枚举、活动／参与者唯一约束及 authorised-only SELECT RLS。没有 schema、migration、生成类型、seed、RLS 或资格写入变更。生产只使用用户 JWT；真实测试中的管理员 client 仅负责本地虚构 fixture 创建和清理。

回退：移除 dinner 模块及消费者引用；provider exact-count 修正可独立回退，但必须同时避免消费者把可能截断的列表当作完整事实。不涉及数据恢复。

## 验证（Node v24.21.0）

```text
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src/features/dinner-verification src/features/attendance/records
node node_modules/next/dist/bin/next build --webpack
node src/features/dinner-verification/run-live-tests.mjs
```

- 全量 Vitest：679 通过、7 跳过；跳过包含已有 Sprint 5 的 3 个真实数据库测试及本模块 4 个 opt-in 真实数据库测试。
- dinner 纯规则／适配器 28 个测试通过；attendance 30 个测试通过。类型检查和相关目录 ESLint 通过。
- webpack production build 通过，使用本地地址与虚构 public key。
- 真实数据库命令已尝试但启动失败：Docker Desktop 在初始化 `dockerInference` 本地 socket 时退出，Linux engine 不可用。不得将 skip 或 provider 原有 CI SQL 测试算成本模块真实适配器测试通过。

## 可复跑的真实数据库验证

恢复本地 Docker 和已迁移的虚构 Supabase 栈（`http://127.0.0.1:45321`）后，从仓库根目录运行最后一条命令。runner 从本地 CLI 获取配置，仅在子进程环境中传递凭据，不打印或写入文件；拒绝远端地址。

`database.test.ts` 只替换 Next 的 cookie/client 边界，实际使用生产 provider、`requireAuthorised`、Auth、PostgREST 和 RLS。覆盖 confirmed、仅报名、错误活动、撤销／恢复以及 committee／无 profile／匿名拒绝和失败更正不改变资格。fixture 使用随机 UUID 和 `.test` 邮箱，结束后按本次 UUID 清理，不 reset 数据库。不宣称覆盖 #31 新 QR writer 或 #33 人工组件。

## 交接与剩余门禁

- 分支：`codex/35-dinner-eligibility`；Draft PR：#87；base：`sprint/7-qr-check-in-dinner`。已同步 #88 合并基线。
- #32 接口缺失阻断已解除。当前阻断是本机 Docker 初始化失败，开始于 2026-09-28（Sydney）。已尝试启动 Desktop/CLI 并核对日志；未重置 Docker 或删除容器数据。
- Yubo 负责环境恢复后执行 4 个真实测试并整理证据；Joshua 是唯一交接对象，负责非作者审查和手动 Project 状态。下次检查建议：2026-09-29 10:00（Sydney），未设置自动提醒。
- #35 尚未通过真实 provider 验收和非作者 review，不标记 Testing/Done。按个人计划，#35 进入 Testing 后启动 #36；#37 还需 #33 可复验。
