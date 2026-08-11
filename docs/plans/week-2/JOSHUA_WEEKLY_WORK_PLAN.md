# Joshua：课程第 3 周（开发第 2 周）独立工作计划

所属统一周计划：[认证、权限与数据基础](WEEK_2_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Xuanwei 的授权输出](XUANWEI_WEEKLY_WORK_PLAN.md)仅在单次集成时接入；独立开发阶段使用冻结的 `AccessContext` stub。

## 1. 独立目标

独立完成 Issue #9：登录、登出、可信会话读取和后台路由保护，覆盖 X-01、X-02、X-03。工作期间不修改数据库 migration、RLS、共享 UI 或测试基础配置。

## 2. 工作包与文件所有权

- 成员姓名：Joshua；
- GitHub Assignee：`Josscui516`；
- 独立工作包：WP-A 认证与会话；
- 主要 Issue：#9；
- GitHub Sprint：`Sprint 2`；
- Sprint 集成分支：`sprint/2-auth-foundation`；
- Issue 分支：`feature/9-auth-session-route-protection`；
- 成员 PR：远程 PR #45，base 必须由仓库管理员从 `main` retarget 为 `sprint/2-auth-foundation`；
- 顺序协调 Issue：#9 进入 `Testing` 后才开始 #10，使用 `feature/10-auth-authorisation-integration`，不得与 #9 同时 `In Progress`；
- Sprint 总 PR 主要 Issue：#41；
- 允许修改：`src/app/(auth)/`、认证 session 模块、认证路由守卫文件（不含 Shiying 所有的受保护 layout）、与单一路由实现紧密关联的 `src/app/(auth)/**/*.test.ts(x)`、`tests/unit/auth/`、`tests/integration/auth/`、`tests/e2e/auth.spec.ts`；
- 禁止修改：`supabase/migrations/`、`supabase/seed.sql`、RLS tests、共享组件目录、CI／测试配置；
- 固定输入合同：Supabase public env；`AuthenticatedUser { id: string }`；未认证统一返回拒绝；
- 输出合同：`getAuthenticatedUser()`、登录／登出服务端动作、受保护路由入口和认证测试命令；
- 集中非作者审查人：Yubo，只在工作包完成后审查一次。

## 3. 开始条件

- 已核对当前 Next.js 版本的 cookies、重定向和路由保护规则；
- Supabase browser／server client 和虚构 Auth 账号可用；
- 认证错误码、成功回跳路径和 `AuthenticatedUser` 已在周初冻结；
- Issue #9 状态与 Git 前提满足；
- 测试密码、session 和 token 不写入仓库或证据。

## 4. 独立执行步骤

### 步骤 1：建立认证基线

执行：

1. 完善服务端 Supabase session client；
2. 实现 `getAuthenticatedUser()` 和统一未认证结果；
3. 定义错误凭据、失效会话和服务失败的安全错误码；
4. 使用本地 stub 验证输出合同。

产出：可信会话模块和认证错误合同。

检查：有效 session 返回用户 ID；缺失／失效 session 不返回后台数据或 token。

### 步骤 2：完成登录、登出与路由保护

执行：

1. 实现登录和登出服务端动作；
2. 保护后台路由和至少一个服务端入口；
3. 限制回跳路径，避免任意外部重定向；
4. 不修改 Shiying 的表单组件，使用最小本地页面或冻结表单接口。

产出：Issue #9 的完整认证行为。

检查：登录、刷新、登出、匿名直接 URL 和直接接口请求符合 X-01–03。

### 步骤 3：个人测试与安全验证

执行：

1. 覆盖有效登录、错误凭据、匿名访问、会话失效和登出；
2. 验证错误不泄露账号是否存在；
3. 运行 lint、typecheck、认证测试和 build；
4. 检查客户端 bundle、日志和证据无 session、token 或密码。

产出：X-01–03 个人验证证据。

检查：全部认证测试通过，失败测试能返回非零结果。

### 步骤 4：一次性交接

执行：

1. 整理公开函数、错误码、保护入口和测试命令；
2. 在单次集成时接入 Xuanwei 的 `requireBackendUser()`，不修改其文件；
3. 向 Yubo 交付认证包供集中审查；
4. Review 发现先判断是否由 #9 diff 引入并违反 X-01–03／认证输出合同；属于 #40、#11、既有结构或其他所有者的问题不得要求 Joshua 越界修改；
5. #9 合并 Sprint 分支并进入 `Testing` 后，顺序完成 #10 的协调集成 PR；
6. 记录未完成项和下周会议路由接入方式。

产出：认证交接包。

检查：接收者只依靠交接说明即可运行 X-01–03。

## 5. 低频沟通规则

- 周初确认一次 `AuthenticatedUser` 和错误码；
- 独立执行期间不安排日常同步；
- 只有 Supabase API 无法满足合同、路由保护失败或出现秘密泄露时临时沟通；
- 不直接修改 Xuanwei、Shiying 或 Yubo 的文件；
- 工作完成后在单次集成点交接，Yubo 周末集中审查一次。

## 6. 个人交付物

- 可信会话和当前用户模块；
- 登录／登出服务端动作；
- 受保护路由和服务端入口；
- 路由旁 colocated tests，以及 `tests/unit/auth/`、`tests/integration/auth/`、`tests/e2e/auth.spec.ts` 中的 X-01–03 feature verification；
- 认证接口和集成说明。

## 7. 个人验收清单

- [ ] X-01、X-02、X-03 通过；
- [ ] 只修改允许文件范围；
- [ ] `AuthenticatedUser` 输出符合冻结合同；
- [ ] 错误不泄露账号、session 或 token；
- [ ] lint、typecheck、认证测试和 build 通过；
- [ ] 交接包可独立复现；
- [ ] PR #45 已以 `sprint/2-auth-foundation` 为 base，且 review 阻塞项确属 #9 或其冻结输出合同；
- [ ] #9 合并后保持 `Testing`；#10 未与 #9 同时 `In Progress`；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| 当前 Next.js 会话刷新方式不同 | 刷新后退出或匿名绕过 | 本地集成测试失败 | 查当前本地文档并修正本工作包 | Joshua | 个人验收前 |
| 授权守卫接口不兼容 | 单次集成失败 | `requireBackendUser()` 无法消费用户输出 | 提交接口变更请求，由 Xuanwei 修改 | Joshua／Xuanwei | 集成检查点 |

### PR #45 review ownership clarification

The route and test findings must be split by deliverable ownership rather than assigned wholesale to one Issue:

1. Issue #11 owns the actual protected layout, navigation, and shared UI route surface. PR #45 must not be required to implement `/dashboard`, `/meetings`, `/tasks`, `/events`, or Shiying's layout/components.
2. Issue #9 still owns the authentication guard, matcher, safe redirect, anonymous page denial, and protected server-entry contract for the frozen back-office URL namespaces. PR #45 may therefore be blocked if its protection mechanism covers only an invented `/backoffice/**` namespace and cannot protect the agreed future routes. Resolution requires guard/matcher coverage and tests, not implementation of the pages.
3. Issue #9 owns the minimum X-01–X-03 feature tests needed to prove sign-in, refresh, sign-out, rejected credentials, and anonymous route/server access. These are Joshua's feature-level verification responsibilities.
4. Issue #41 owns shared test configuration, `tests/acceptance/`, the cross-work-package X-01–X-07 harness, CI/quality orchestration, fixtures, and the Sprint-level M1 evidence. PR #45 must not be blocked for failing to implement those #41 deliverables.
5. The repository baseline explicitly permits tests that are specific to one route to remain beside that route under `src/app/`. Therefore the `src/app/(auth)/**/*.test.ts(x)` files are not defects merely because they are colocated. Pure `src/lib/auth/*.test.ts` coverage belongs under `tests/unit/auth/`, and cross-entry Proxy/session behavior belongs under `tests/integration/auth/` unless the team records a narrower approved exception. This placement correction remains #9 feature-test work; it is not transferred to #41.

PR #45 does not own #40 RLS/role authorisation, #11 UI implementation, or #41 shared acceptance infrastructure. Review comments must state the exact behavior or file contract that remains #9-owned instead of asking Joshua to complete another assignee's Issue.

## 9. 未完成项处理

- 会话安全失败或秘密暴露立即升级；
- 非阻断视觉问题交给后续 backlog，不修改 Shiying 文件；
- 接口问题先记录请求，不越界修复；
- 未通过 X-01–03 时工作包保持未完成。

## 10. 周末交接

- 已完成：可信会话、登录、登出、路由保护和认证测试；
- 未完成：按实际结果记录；
- 输出合同：`getAuthenticatedUser()`、认证动作、错误码和测试入口；
- 集成注意事项：只在服务端消费当前用户结果；
- Sprint PR 纳入证据：#9／#10 的 checks、非作者 review、X-01–06 结果和剩余风险；
- 下周建议：会议路由直接复用保护入口。
