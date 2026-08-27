# M1 验收记录

> 主要 Issue：#41
>
> Sprint：Sprint 2
>
> 当前结论（2026-08-27 复核）：技术验收继续通过，Sprint 总 PR #52 已合并，相关 Sprint 2 Project 项已为 `Done`／`Passed`。历史上 #52 未留下可核对的非作者 review，Epic Acceptance Gate 仍为 `Not checked`；这些历史流程证据不能事后伪造，只能由 Joshua 明确接受偏差并手动补充 Epic 门禁。

## 1. 验收矩阵

| 场景 | 固定预期 | 当前证据 | 结论 |
|---|---|---|---|
| X-01 | 有效后台用户可以登录、刷新会话并安全登出 | 真实 `@supabase/ssr` cookie adapter 覆盖登录写入、跨请求刷新、登出清除和登出后拒绝 | 通过 |
| X-02 | 错误凭据不创建会话且不泄露账号是否存在 | SSR 集成验证拒绝凭据无会话；错误密码与未知账号映射为同一安全错误 | 通过 |
| X-03 | 匿名页面和服务端请求不返回后台数据 | Proxy 与 `/api/backoffice/session` 测试覆盖页面跳转、API `401` 和无后台数据 | 通过 |
| X-04 | 两种后台角色可协调，敏感访问仅限 authorised | `requireBackendUser()`、`requireAuthorised()` 与集成页面测试覆盖两种角色及 authorised-only 路由 | 通过 |
| X-05 | committee 无法绕过服务端或数据库权限 | 页面在敏感内容渲染前拒绝 committee；RLS pgTAP 覆盖明细拒绝、自提权和受保护字段伪造 | 通过 |
| X-06 | 匿名 token 操作仅暴露最小且不可枚举的合同 | 默认拒绝策略、token RPC 权限测试与固定统一错误覆盖最小匿名边界 | 通过 |
| X-07 | 反馈状态可区分、可访问并会终止 | `/login` 已实际接入 `LoginShell`、`FormField`、`SubmitButton` 和 `AuthErrorFeedback`；组件回归覆盖六类状态与语义，真实浏览器在 1280×900 和 320×800 下无横向溢出，Tab 顺序为 Email → Password → Sign in，错误凭据显示统一安全反馈 | 通过 |

本表不得在缺少 adapter、独立审查或真实检查结果时标记为通过。自动化入口为
`npm run test:acceptance`；最终整组入口为 `npm run test:m1`。缺少 adapter 时必须返回明确的阻塞结果，不得使用默认成功值。

## 2. 统一质量入口

| 类别 | 命令 |
|---|---|
| Lint | `npm run lint` |
| TypeScript | `npm run typecheck` |
| 应用与验收测试 | `npm test`、`npm run test:acceptance` |
| 数据库重放与测试 | `npm run db:reset:no-seed`、`npm run db:reset`、`npm run db:test` |
| 双连接数据库验收 | `npm run db:test:concurrency` |
| 数据库 lint／漂移 | `npm run db:lint`、`npm run db:diff` |
| 生产构建 | `npm run build` |
| M1 整组入口 | `npm run test:m1` |

完整集成验收还必须运行 #39 与 #40 提供的真实双连接并发入口，并记录精确断言数。
`Quality` 工作流中的独立 `Database` 检查会依次执行无 seed／有 seed migration 重放、
数据库测试、数据库 lint 和空漂移验证；`Build` 只有在应用测试与数据库检查均成功后才运行。
CI 只启动这些检查所需的本地 PostgreSQL 容器，不连接远程项目，也不启动无关服务。
双连接脚本已通过 `npm run db:test:concurrency` 接入 `Quality` 的 `Database` 检查；缺少该步骤时不得把普通数据库检查解释为
X-01 至 X-07 已通过。数据库测试入口会把 `Files=0`、`Tests=0` 或 `NOTESTS` 视为失败，
避免 Supabase CLI 的零测试成功退出码造成假绿色门禁。

2026-08-13（Australia/Sydney）最终数据库集成复跑结果：无 seed／有 seed migration 重放通过；3 个 pgTAP 文件共 187 项通过；约束双连接 18 项和 RLS／签到双连接 9 项通过；数据库 lint 无错误且 schema diff 为空。

同日登录 UI 最终接线后，`npm test` 通过 122 项应用测试和 25 项自动化测试，`npm run test:acceptance` 通过 120 项 Vitest，production build 通过。真实浏览器验证桌面 1280×900、窄屏 320×800、键盘焦点、安全错误反馈和控制台状态；只提交虚构 `.example.test` 数据，未使用、保存或输出任何真实账号凭据、cookie 或 token。

## 3. 脱敏证据格式

证据只记录命令、Git commit、通过／失败状态、断言数量、脱敏摘要和阻塞负责人。
不得保存或粘贴以下内容：

- 密码、cookie、session、JWT、check-in token 或授权 header；
- Supabase secret／service-role key、数据库密码或 Vercel token；
- 真实参与者姓名、邮箱、学号、报名、签到或晚餐资格；
- 未脱敏的 provider 错误、数据库 dump、日志或截图。

测试 fixture 统一使用 `.example.test` 地址和固定虚构 UUID。发现敏感证据时立即停止传播，
撤回相关输出并执行凭据轮换与暴露范围评估。

## 4. 当前阻塞与责任

| 阻塞 | 影响 | 负责人／所需动作 | 下次检查 |
|---|---|---|---|
| Sprint 总 PR #52 无可核对的非作者 review | 历史交付未满足当前审查证据标准，且无法事后重建真实审批 | Joshua 记录接受该历史流程偏差，后续 Sprint 严格执行非作者 review | Sprint 4 总 PR 前复核流程 |
| Sprint 2 Epic Acceptance Gate 为 `Not checked` | 项目级验收字段与已完成的技术证据不一致 | Joshua 核对本记录后手动更新 Project 字段 | 下一次 Project 整理窗口 |

## 5. 最终结论规则

只有 X-01 至 X-07 全部通过、完整质量命令成功、数据库 migration/RLS/并发检查成功、
浏览器桌面／窄屏／键盘／可访问性回归通过、所有纳入 Issue 均为 `Testing` 且
Acceptance Gate 为 `Passed`、所有阻塞 review thread 已解决并取得非作者审批时，M1 才能
从“未完成”改为“通过”。任何一项缺失时结论保持阻塞，并记录负责人和下一次检查时间。
