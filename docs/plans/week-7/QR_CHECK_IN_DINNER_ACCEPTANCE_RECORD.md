# Sprint 7：QR 签到与晚餐核验验收记录

验收日期：2026-09-30（Australia/Sydney）。主要集成 Issue 为 #7，晚餐汇总为 #8；
Project Sprint 7 精确集合为 #7、#8、#30、#31、#32、#33、#34、#35、#36、#37。
本记录的技术验收已通过；main 合并、远程 checks、部署及最终 Done 状态以
[GitHub Project 5](https://github.com/users/Josscui516/projects/5) 和 #7 的交付记录为准。

## 1. 基线、授权与 PR 处理

- Sprint 6 main 基线：`b7da5e7a197f3dd2357b7eba53a6293b7d5ef4e4`。
- 集成分支：`sprint/7-qr-check-in-dinner`；验收分支：`codex/7-check-in-dinner-acceptance`。
- #85、#88、#90 已合入；本轮完整审查和验证后依次合入 #86、#91、#87。
  三项合并 SHA 分别为 `cbf5f240c33655c686e8d4847f14ea1cf271f490`、
  `53a1c0850815ed3c7a5c536f798bcbfa3b0187ad`、
  `d84f000d55d29c3d53ee4237a141a1891da88bfe`。
- #87 延续此前已批准的 #35–#37 合并交付范围；#89 的审计补充已包含在 #90，
  因而关闭重复 Draft，没有重复合并。
- 用户明确要求完成修复、Git 交付、全部 PR 处理和 Project 更新，并明确批准
  本次 #86/#87/#91、验收及最终 Sprint 总 PR 的非作者审查门禁例外。
  此例外仅适用于本次交付；Codex 验证不冒充团队成员批准，不修改长期门禁。
- 本轮发现并修复：晚餐页缺少活动／签到上下文入口；无有效 profile 的账号返回
  登录时发生拒绝页循环；限速 RPC 缺少生成类型；部分 live fixture 硬编码默认库。
  均属于 #7 集成缺口，增加导航／登录回归测试、工具生成类型和隔离库运行入口。

## 2. 需求追踪与实际证据

| 需求／场景 | 证据与结果 |
|---|---|
| CHECKIN-01，K-01 | Chrome 生成实际 QR，解码图片与一次性 URL 完全一致，仅指向 `/check-in/[token]`；离页后明文不再显示，撤销后公开页显示 unavailable；token 管理测试覆盖轮换 |
| CHECKIN-02/03，K-02/03 | Chrome 对已报名虚构参与者首次扫码成功；真实 HTTP 与 SQL 验证有效／无效 token、报名匹配、窗口和取消状态；token 单元／SQL 测试覆盖开窗包含、关窗不包含、Sydney DST |
| CHECKIN-04，K-04 | HTTP 并发 QR 返回 success + already_processed，DB 只有一行；双连接脚本证明 QR/manual 锁竞争、唯一性、更正 CAS；voided 后再扫不恢复、不改变原审计 |
| CHECKIN-05，K-05 | Chrome 审计展示 QR、Self-service QR、时间；人工记录展示 Manual、当前虚构 authorised 操作者及更新时间；SQL 验证条件审计约束 |
| CHECKIN-06，K-06 | Chrome 为已有但未报名参与者补签，报名仍为 1、签到变为 2；撤销 QR 后签到变为 1；窄屏以 Space/Enter 恢复成功；失败与并发路径由服务／真实 DB 测试覆盖 |
| CHECKIN-07，K-07/08、X-05 | Chrome authorised 可读／写；committee 只见数字、无敏感操作，直接签到／晚餐 URL 被拒绝；匿名跳转登录；无 profile 被拒绝并能切换账号；服务端和 RLS allow/deny 均通过 |
| DINNER-01/02，D-01/02 | 资格只从当前活动 confirmed 推导；Chrome 显示两个 Eligible，撤销后对应记录变 Not Eligible Yet，恢复后重算；缺失、voided、错活动由纯函数与真实 DB 测试覆盖，没有资格写表／接口 |
| DINNER-03/04，D-03/04 | authorised 可核验，committee 直达拒绝；新读取和 Refresh eligibility 查询当前 DB，汇总随更正从 2→1→2；失败、不完整 provider、陈旧结果和并发不伪成功 |
| 公开入口安全 | 真实 HTTP 验证 no-store、仅 outcome 响应、无匹配统一失败及 429；路由测试覆盖大小上限／格式错误／系统错误；窄 RPC anon/authenticated 不可执行 |
| UI 状态与回归 | Chrome 验证 success、重复、拒绝、撤销无效、空筹备状态、真实 loading 和窄屏／键盘；单元覆盖 validation/system error；既有 Dashboard、会议、任务、活动、报名回归通过 |

## 3. 执行环境与命令

使用 Node 24.18.0、Next 16.3.0 默认 Turbopack 生产构建、Chrome 扩展。
本地专用 Supabase workdir 为 `tmp/sprint7-db`，project_id 为
`mahjongflow-issue33-sprint7`，API 46321、DB 46322；容器
`supabase_db_mahjongflow-issue33-sprint7`。原 `MahjongFlow` 数据卷保留，
所有 reset、truncate 和 fixture 写入仅发生在该隔离栈。`.env.local` 未修改，
本地密钥从 CLI status 读取后仅在进程内传递；截图没有明文 token 或真实数据。

| 命令／检查 | 最终结果 |
|---|---|
| `npm run lint`、`npm run typecheck` | 通过 |
| `npm test` | 861 应用测试通过，10 个 live opt-in 默认跳过；另 5 个脚本测试通过 |
| `npm run test:acceptance` | 151 通过，3 个 live opt-in 默认跳过，属于上述测试子集 |
| `node src/features/dinner-verification/run-live-tests.mjs --workdir tmp/sprint7-db` | 上述 7 个晚餐 live opt-in 单独通过真实 Auth/PostgREST/RLS |
| Sprint 5 live 回归 | 上述另 3 个 opt-in 单独通过；从既有 `local-runtime.cjs` 生成临时隔离包装，仅替换 workdir、端口、容器及临时 fixture 目录 |
| `$env:SUPABASE_WORKDIR='tmp/sprint7-db'; npm run db:test` | 17 SQL 文件、447 断言通过 |
| 报名／RLS 双连接脚本 | 分别 18 和 9 断言通过，串行运行避免 pgTAP extension 安装冲突 |
| `node tests/integration/attendance/manual/database-concurrency.mjs supabase_db_mahjongflow-issue33-sprint7` | 4 竞争场景通过；已加入 CI 的 Database job |
| `node tests/fixtures/check-in-dinner/local-runtime.mjs verify-http` | 真实生产 HTTP QR 并发／重复／voided／无匹配／429／撤销通过 |
| `node tests/fixtures/check-in-dinner/local-runtime.mjs verify-rollback` | 事务模拟停公开写入，签到逐行不变，rollback 恢复权限 |
| `supabase db lint --local --workdir tmp/sprint7-db --fail-on error` | 无 schema 错误 |
| `supabase db diff --local --workdir tmp/sprint7-db` | 无漂移 |
| `node tests/fixtures/check-in-dinner/local-runtime.mjs build` | 默认 Turbopack 生产构建通过，17 静态页及预期动态路由 |
| `git diff --check`、Markdown 相对链接 | 通过；远程 CI 由 PR checks 记录 |

准备同类隔离栈时，复制仓库 `supabase/config.toml`、migrations、seed、tests 到
`tmp/sprint7-db/supabase`，替换 project_id 和所有 4532x 端口为 4632x，再
`supabase start --workdir tmp/sprint7-db -x vector`。如 4632x 已被占用，应另选
完整隔离端口并同步 fixture；不得停止未知服务或 reset 用户已有栈。

本地复验先在进程环境中指定虚构 `SPRINT7_FIXTURE_PASSWORD`，执行
`node tests/fixtures/check-in-dinner/local-runtime.mjs setup`，再 build、start；
应用为 `http://localhost:3107`。`responsive-preview.mjs` 提供 localhost:3108 的
390×844 iframe 验证容器，不增加产品路由、API mock 或放宽权限。停止对应
Node 终端即可；不要删除用户原有数据卷。

## 4. Chrome 视觉与交互证据

- [桌面晚餐页](artifacts/chrome-dinner-desktop.jpg)
- [390px 晚餐页](artifacts/chrome-dinner-mobile.jpg)
- [390px 签到审计](artifacts/chrome-attendance-mobile.jpg)

Chrome 视口覆盖 API 没有实际改变外层窗口，因此使用真实 iframe 内视口；
390px 宽度扣除滚动条后 `html.clientWidth == html.scrollWidth == 375`。
资格页面和签到表单均无横向溢出；原生菜单／操作字段、复核 checkbox、
Space/Enter 提交可用。截图来自本地生产构建和真实隔离 DB，不是 mock。
桌面截图中资格为 2；窄屏截图在撤销后为 1，是同一验收序列的不同时间点。

## 5. Migration、生产和回退

隔离库先重放无 seed 基线、带 seed 全量，另 reset 到 Sprint 6 最后 migration，
再依次升级两项 Sprint 7 migration，均通过。用 CLI 重新生成
`public,graphql_public` 类型，新增限速函数契约，保留原 graphql schema。
停公开写入的事务演练保留每一行签到历史；实际回退流程见
[数据库运维](../../operations/DATABASE_MIGRATIONS.md)。

2026-09-30 发现远程 MahjongFlow Supabase 项目暂停，已恢复原项目；恢复稳定后
核对原十项 migration 均在。按文件顺序用 Supabase migration 工具应用本 Sprint
两项 SQL，未执行远程 seed/reset、未读取真实参与者或更改历史业务行。
工具自动生成的版本号随即只对这两条新记录校准为仓库原始版本
`20260916000100` 和 `20260927032601`，未改既有 migration 历史。
生产 RPC 权限复核：anon/authenticated 均拒绝，service_role 允许。
main 应用发布及健康复验在 #7／Sprint 总 PR 中追加实际 SHA、Ready 和 HTTP 结果。

## 6. 交付门禁与后周边界

所有十项须进入并保持 Testing，直到唯一 Sprint 总 PR 合入 main、必需 checks 和生产复验
完成，再逐项手动确认 Acceptance Gate Passed、Done 和关闭。没有 Project 自动化。
本次明确审查例外应写入 PR；后续 Sprint 恢复团队独立审查。
#6、#29 和开发第 8 周完整内部验收仍保留原范围，不随 Sprint 7 提前关闭。
