# #35：晚餐资格纯推导

本模块实现 DINNER-01/02、DIN-C01–03 的纯计算部分。它不读取数据库、不提供公开接口、不保存资格，也不承担鉴权。

## 公共入口

从 `@/features/dinner-verification` 导入 `calculateDinnerEligibility` 与 `DinnerAttendanceFact`。

输入为当前 `eventId`、目标 `participantId`、该参与者当前唯一签到事实（或明确缺失的 `null`／`undefined`）。只有两个 ID 均匹配且 `attendanceStatus` 为 `confirmed` 时返回 `Eligible`；其余返回 `Not Eligible Yet`。报名、签到方式和额外个人属性不是资格条件，已确认的人工现场例外同样有效。

这里的事实类型是消费者所需的最小输入，不宣称是 #32 已交付的 DTO。等待 Shiying 的公开 read port 后，在服务端显式映射其实际 DTO；不得读取 provider 内部 repository，也不得把数据库完整记录传给客户端。读取失败必须作为错误传播，不能转换为缺失签到并展示不符合资格。

调用方必须使用当前数据库事实，不能传入历史签到快照。函数不会缓存资格，但这不等于已经实现 #37 的页面刷新和真实更正链路。

## Schema 与权限核对

- 基线已经存在 `attendance_records`、`confirmed`／`voided` 枚举及 `UNIQUE(event_id, participant_id)`。
- `attendance_records_authorised_select` 依赖 `private.is_authorised()`。未来服务端查询必须使用用户 JWT 和 authorised 检查，继续由 RLS 控制访问。
- 已静态核对基线 migrations 与生成类型，没有独立 dinner／eligibility 字段或表。本次不修改数据库、RLS、生成类型、seed 或个人属性；不需要 migration／数据回退。
- 本模块没有页面、Server Action 或网络入口。#36 的路由／服务／RLS 三层权限和 loading／empty／error 状态仍待其前置门禁满足后实现，不能用这些纯函数测试代替。

## 当前验证与交接

2026-09-28 核对 Sprint 分支基线 `f44b64a`。#32 的 `src/features/attendance/records/` 尚不存在，也没有对应远端成员分支，因此真实 provider 接入和数据库事实集成测试尚未完成。

使用 Node `v24.21.0` 执行：

```text
node node_modules/vitest/vitest.mjs run src/features/dinner-verification
node node_modules/vitest/vitest.mjs run
node --test .github/scripts/run-database-tests.test.mjs
node node_modules/next/dist/bin/next typegen
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js .
```

结果：本模块 15 个测试通过；全量 Vitest 636 个通过、3 个跳过（既有 Sprint 5 实际数据库测试未启用）；数据库测试运行器自身 5 个测试通过；路由类型生成、TypeScript 和全库 ESLint 检查通过。运行器测试不代表数据库权限测试已执行。依赖安装使用 `npm ci --ignore-scripts --no-audit --no-fund`，未更改锁文件；系统默认 Node 22 的引擎提示已通过使用 Node 24 执行验证解决。

未执行生产 build、真实 DB／provider 集成、#36 页面验收与 #37 更正回归。本次仅新增框架无关纯函数；最终 #35 验收仍需接入 #32 并复验真实事实，不可标为 Done 或 Testing。

阻断记录：

- 原因／影响：#32 公开读取接口缺失，无法完成 #35 真实接入；#35 未进入 Testing，因此按个人计划暂不启动 #36/#37。
- 已尝试：核对远端分支、Project Sprint 字段、#32/#35 Issue 和双方个人计划；已完成独立纯函数与虚构样例验证。
- 所需帮助／负责人：Shiying 提供已验证的 authorised-only 当前活动 read port；Yubo 接入并复验；Joshua 负责独立审查与手动状态维护。
- 开始日期：2026-09-28（Sydney）；下次团队检查建议：2026-09-29 10:00（Sydney），未创建自动提醒。
- 唯一交接对象：Joshua。交付分支为 `codex/35-dinner-eligibility`，基于 Sprint 7；按用户授权以 Draft 成员 PR 发布当前独立部分，Project 状态保持不变。
- 下一安全操作：#32 公共入口交付后接入并测试，更新 `codex/35-dinner-eligibility` 的 Draft 成员 PR，base 为 `sprint/7-qr-check-in-dinner`；通过非作者审查并进入 Testing 后再推进 #36。
