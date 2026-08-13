# M1 验收记录

> 主要 Issue：#41
>
> Sprint：Sprint 2
>
> 当前结论：技术验收通过；交付流程仍等待 #41 最新集成 PR 的非作者审批、六个 Issue 的 `Testing`／Acceptance Gate 同步、Vercel Preview 处理和 Sprint 总 PR 独立审查，因此 Sprint 尚未完成。

## 1. 验收矩阵

| 场景 | 固定预期 | 当前证据 | 结论 |
|---|---|---|---|
| X-01 | 有效后台用户可以登录、刷新会话并安全登出 | 真实 `@supabase/ssr` cookie adapter 覆盖登录写入、跨请求刷新、登出清除和登出后拒绝 | 通过 |
| X-02 | 错误凭据不创建会话且不泄露账号是否存在 | SSR 集成验证拒绝凭据无会话；错误密码与未知账号映射为同一安全错误 | 通过 |
| X-03 | 匿名页面和服务端请求不返回后台数据 | Proxy 与 `/api/backoffice/session` 测试覆盖页面跳转、API `401` 和无后台数据 | 通过 |
| X-04 | 两种后台角色可协调，敏感访问仅限 authorised | `requireBackendUser()`、`requireAuthorised()` 与集成页面测试覆盖两种角色及 authorised-only 路由 | 通过 |
| X-05 | committee 无法绕过服务端或数据库权限 | 页面在敏感内容渲染前拒绝 committee；RLS pgTAP 覆盖明细拒绝、自提权和受保护字段伪造 | 通过 |
| X-06 | 匿名 token 操作仅暴露最小且不可枚举的合同 | 默认拒绝策略、token RPC 权限测试与固定统一错误覆盖最小匿名边界 | 通过 |
| X-07 | 反馈状态可区分、可访问并会终止 | 组件测试覆盖六类状态、语义与终止；真实 `/login` 在 1280×900 和 320×800 下保留标签、输入和提交，Tab 首次聚焦 Email | 通过 |

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

2026-08-13（Australia/Sydney）最终集成复跑结果：无 seed／有 seed migration 重放通过；3 个 pgTAP 文件共 187 项通过；约束双连接 18 项和 RLS／签到双连接 9 项通过；数据库 lint 无错误且 schema diff 为空；最终验收入口共 117 项 Vitest 通过。浏览器验收未使用、保存或输出任何账号凭据、cookie 或 token。

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
| #41 最终 adapter／CI 增量尚无非作者审批 | 技术证据不能成为团队批准 | Shiying 审查最新 #41 集成 PR | PR Ready 后立即 |
| 六个 Sprint Issue 的 Project 状态仍为 `Review`，#10／#11／#41 Acceptance Gate 尚未同步 | Sprint 总 PR 自动化会拒绝整组完成 | 集成负责人依据最新 review 和证据恢复为 `Testing`／`Passed` | #41 合并后立即 |
| 非项目成员的 Vercel Preview 被阻止 | 远程共享 Preview 门禁不完整 | Vercel 项目所有者授予权限、安全重跑或记录批准的等价共享环境证据 | Sprint 总 PR 审查前 |
| Sprint 总 PR #52 正文仍是模板且尚未包含最新集成结果 | 无法独立审查或合并到 `main` | Yubo 在全部 Issue 进入 `Testing` 后更新正文并请求非作者审查 | Project 状态同步后 |

## 5. 最终结论规则

只有 X-01 至 X-07 全部通过、完整质量命令成功、数据库 migration/RLS/并发检查成功、
浏览器桌面／窄屏／键盘／可访问性回归通过、所有纳入 Issue 均为 `Testing` 且
Acceptance Gate 为 `Passed`、所有阻塞 review thread 已解决并取得非作者审批时，M1 才能
从“未完成”改为“通过”。任何一项缺失时结论保持阻塞，并记录负责人和下一次检查时间。
