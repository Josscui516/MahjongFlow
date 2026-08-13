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
- 成员 PR：远程 PR #45，以 `sprint/2-auth-foundation` 为 base；
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

产出：[认证交接包](JOSHUA_AUTH_HANDOFF.md)。

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

- [x] X-01、X-02、X-03 通过——2026-08-11 复跑的 73 个自动化测试覆盖三项合同，其中真实 `@supabase/ssr` cookie adapter 集成测试验证登录写入、跨请求保持、登出清除、登出后拒绝以及错误密码／未知账号无 session；X-03 另有匿名生产运行时证据，且 2026-08-09 的虚构账号浏览器验收未记录凭据或 session；
- [x] 只修改允许文件范围——本变更的认证、会话、路由守卫和 feature-level 测试均属于 Joshua 的文件所有权；
- [x] `AuthenticatedUser` 输出符合冻结合同——成功结果仅为 `{ id: string }`，失败结果仅为固定认证错误码；
- [x] 错误不泄露账号、session 或 token——未知账号与错误密码映射为同一错误，客户端边界及构建产物敏感标记扫描通过；
- [x] lint、typecheck、认证测试和 build 通过——2026-08-11 复跑结果为 8 个测试文件、73 个测试通过，四条质量命令退出码均为 0；
- [x] 交接包可独立复现——公开合同、测试映射、四条复现命令和手动步骤已记录，相对链接检查通过；
- [x] PR #45 已以 `sprint/2-auth-foundation` 为 base；剩余复审只处理 #9 或其冻结输出合同；
- [ ] #9 合并后保持 `Testing`；#10 未与 #9 同时 `In Progress`；
- [x] 未完成项有负责人、期限和下次检查时间——详见[认证交接包](JOSHUA_AUTH_HANDOFF.md)第 5–6 节。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| 当前 Next.js 会话刷新方式不同 | 刷新后退出或匿名绕过 | 本地集成测试失败 | 查当前本地文档并修正本工作包 | Joshua | 个人验收前 |
| 授权守卫接口不兼容 | 单次集成失败 | `requireBackendUser()` 无法消费用户输出 | 提交接口变更请求，由 Xuanwei 修改 | Joshua／Xuanwei | 集成检查点 |

### PR #45 审查发现的责任归属

路由与测试相关发现必须按交付物所有权划分，不能一概归入同一个 Issue：

1. Issue #11 负责受保护 layout、导航和共享 UI 路由表面；#45 不实现 `/dashboard`、`/meetings`、`/tasks`、`/events` 或 Shiying 的 layout／组件。
2. Issue #9 仍负责冻结后台 URL namespace 的认证 guard、matcher、安全回跳、匿名页面拒绝和受保护服务端入口合同；若保护机制只覆盖虚构的 `/backoffice/**` 而无法保护约定路由，#45 需以 guard／matcher 覆盖和测试修复，不接管页面实现。
3. Issue #9 负责证明 X-01–X-03 所需的最小功能测试：登录、刷新、登出、拒绝凭据以及匿名页面／服务端访问。
4. Issue #41 负责共享测试配置、`tests/acceptance/`、跨工作包 X-01–X-07 harness、CI／质量编排、fixture 和 Sprint 级 M1 证据；#45 不因未实现这些 #41 交付物而阻塞。
5. 单一路由专属测试可 colocate 在 `src/app/`；`src/app/(auth)/**/*.test.ts(x)` 不因 colocate 而成为缺陷。纯 `src/lib/auth/*.test.ts` 覆盖归入 `tests/unit/auth/`，跨入口 Proxy／session 行为归入 `tests/integration/auth/`，除非团队记录更窄的例外。

#45 不负责 #40 的 RLS／角色授权、#11 的 UI 实现或 #41 的共享验收基础设施。审查意见必须指明仍由 #9 负责的行为或文件合同，不得要求 Joshua 修改其他成员所有文件。

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
