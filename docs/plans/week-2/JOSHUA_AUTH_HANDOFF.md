# Joshua：认证与会话一次性交接包

本交接包对应 [Issue #9](https://github.com/Josscui516/MahjongFlow/issues/9)、AUTH-01–02 和验收场景 X-01–03。接收者为 Yubo；本文件只交付 Joshua 工作包的公开合同和脱敏验证入口，不代表 Xuanwei 的 AUTH-03–04 或 X-04–06 已完成。

## 1. 交接状态

- 工作分支：`feature/9-auth-session-route-protection`；
- 已完成：可信当前用户读取、登录、登出、会话刷新写回、后台页面保护、后台 API 保护、安全回跳和自动化测试；
- 数据库影响：无 schema、migration、RLS 或生成类型变更；
- 隐私影响：响应只暴露认证布尔值或固定错误码，不返回用户资料、session、token 或密码；
- Git 交接：以 Issue #9 的功能分支、commit 和 Pull Request diff 为实现事实源；本文件不记录凭据或本地环境值。

## 2. 公开合同

### 当前用户

服务端入口：`src/lib/auth/session.ts`

```ts
getAuthenticatedUser(): Promise<AuthenticatedUserResult>
```

成功结果只包含冻结合同中的用户 ID：

```ts
{ ok: true, user: { id: string } }
```

失败结果只包含固定错误码：

```ts
{ ok: false, error: "AUTH_INVALID_SESSION" | "AUTH_SERVICE_UNAVAILABLE" }
```

`session.ts` 是 `server-only` 模块。Client Component、浏览器 bundle 和公开 DTO 不得导入或透传该结果中的服务端细节。

### 认证动作

服务端动作位于 `src/app/(auth)/actions.ts`：

- `loginAction(previousState, formData)`：接受 `email`、`password` 和可选 `next`；成功后只跳转到 `/backoffice` 子树；
- `logoutAction(previousState)`：先验证当前用户，再使用 local scope 清除当前会话，成功后跳转 `/login`。

### 错误码

错误合同位于 `src/lib/auth/contracts.ts`：

| 错误码 | 含义 | 对外行为 |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 凭据无效或输入不合格 | 登录表单显示统一提示，不区分未知账号与错误密码 |
| `AUTH_INVALID_SESSION` | session 缺失、失效或用户不存在 | 页面跳转登录；后台 API 返回 `401` |
| `AUTH_SERVICE_UNAVAILABLE` | Auth 服务暂时不可用 | 页面或动作显示安全通用提示；后台 API 返回 `503` |

不得把 Supabase 原始错误消息、账号存在性、session、token 或密码加入这些响应。

## 3. 保护入口

| 入口 | 已认证 | 匿名／失效 session | 服务失败 |
|---|---|---|---|
| `/backoffice` 及其子路径 | 继续请求并保留刷新后的 cookie | `307` 到 `/login?next=...` | `503` |
| `/api/backoffice` 及其子路径 | 继续请求并保留刷新后的 cookie | `401` + `AUTH_INVALID_SESSION` | `503` + `AUTH_SERVICE_UNAVAILABLE` |
| `GET /api/backoffice/session` | `200` + `{ "authenticated": true }` | `401`，不返回后台数据 | `503`，不返回 provider 细节 |

路由匹配器位于 `src/proxy.ts`。成功回跳由 `src/lib/auth/redirect.ts` 限制为 `/backoffice` 自身或其子路径，外部 URL 和其他站内路径均回退到 `/backoffice`。认证响应设置 private/no-cache/no-store，避免缓存受保护状态。

## 4. Yubo 复现 X-01–03

在仓库根目录使用不包含真实凭据的环境运行：

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

2026-08-09 作者复跑结果：`npm test` 通过 7 个测试文件、44 个测试；`npm run lint`、`npm run typecheck` 和 `npm run build` 均以退出码 0 完成。生产构建识别到 `/login`、`/backoffice`、`/api/backoffice/session` 和 Proxy。`git diff --check` 通过；仓库中不存在个人负向验证使用过的临时失败测试文件。

2026-08-09 已使用本地专用虚构 Supabase 账号完成 X-01–02 浏览器验收；测试结果由 Joshua 确认，未保存或传播邮箱、密码、session、token 或 cookie。

测试证据映射：

- X-01：`src/app/(auth)/actions.test.ts` 覆盖有效登录和登出；`src/proxy.test.ts` 覆盖已认证请求的 session 刷新响应；
- X-02：`src/lib/auth/credentials.test.ts` 与 `src/app/(auth)/actions.test.ts` 覆盖未知账号／错误密码的统一错误和无 session 成功路径；
- X-03：`src/proxy.test.ts` 与 `src/app/(auth)/api/backoffice/session/route.test.ts` 覆盖匿名页面跳转、直接 API 拒绝和无后台数据；
- 共享安全边界：`src/lib/auth/authenticated-user.test.ts` 覆盖失效 session 与 provider 故障；`src/lib/auth/redirect.test.ts` 覆盖开放重定向拒绝。

手动浏览器验收必须使用专用虚构账号，不得把邮箱、密码、session、token、cookie 或真实参与者资料保存到命令、日志、截图、Issue、PR 或本文件：

1. 登录 `/login`，确认进入 `/backoffice`；
2. 刷新 `/backoffice`，确认仍保持认证；
3. 登出，确认返回 `/login`，且直接访问 `/backoffice` 会再次被拒绝；
4. 分别使用错误密码和不存在的虚构邮箱，确认两者显示相同错误且不创建 session；
5. 匿名请求 `/api/backoffice/session`，确认返回 `401`、固定错误码且无后台数据。

## 5. Xuanwei 授权守卫集成状态

截至 2026-08-09，工作树中不存在 Issue #40 约定由 Xuanwei 所有的 `src/lib/auth/authorization.ts`，也没有可导入的 `requireBackendUser()`。因此本次没有越权创建或修改该文件，当前页面和 API 只执行身份认证，不执行 committee／authorised 角色授权。

集成请求：Xuanwei 提供以下冻结输出后，由 Joshua 只修改自己的认证路由入口来消费它；接口不一致由 Xuanwei 在其所有文件中处理。

```ts
type AccessContext = Readonly<{
  userId: string;
  role: "committee" | "authorised";
}>;

requireBackendUser(): Promise<AccessContext>
```

- 影响：在守卫接入前，不得把当前 `/backoffice` 认证基线当作敏感参与者数据的完整授权边界；
- 负责人：Xuanwei 提供守卫，Joshua 完成认证入口消费，Yubo 复跑集成验收；
- 下次检查：2026-08-10 的单次集成检查点；
- 完成条件：`requireBackendUser()` 可消费真实 `getAuthenticatedUser()` 输出，committee 与 authorised 可进入普通后台，anon 与无 profile 用户被服务端拒绝，且 X-01–06 回归通过。

## 6. 未完成项与下周接入

| 未完成项 | 影响 | 负责人 | 期限／下次检查 | 完成证据 |
|---|---|---|---|---|
| 接入 `requireBackendUser()` | 当前只认证身份，尚未验证后台角色／profile | Xuanwei／Joshua | 2026-08-10 集成检查点 | 授权模块测试、类型检查和 X-01–06 |
| 集中非作者审查 | 当前结果仍是作者自测，不构成团队批准 | Yubo | 工作包形成可审查 commit 后 | 审查结论和必要的变更请求 |

下周会议路由应在 Server Component、Route Handler 或 Server Action 的入口调用 Xuanwei 的 `requireBackendUser()`，普通协调功能消费其最小 `AccessContext`；参与者、报名、签到和晚餐资格明细必须改用 `requireAuthorised()`，并继续依赖 Supabase RLS。会议 Client Component 不得导入 `session.ts`、授权模块、secret key 或完整敏感记录类型。

## 7. Yubo 接收条件

Yubo 可按以下顺序完成一次集中审查：

1. 核对 diff 只涉及 Issue #9 和本交接材料，且无 secret、真实账号或参与者数据；
2. 运行第 4 节四条命令并记录退出状态；
3. 按测试文件映射核对 X-01–03，不把 mock 证据表述成真实账号端到端证据；
4. 确认数据库／RLS 不适用于本 diff，并把 X-04–06 留给 Issue #40；
5. 若公开合同无法被 adapter 消费，只提交变更请求，不直接修改 Joshua 的认证实现。

若上述命令通过且未发现阻断问题，认证包可以进入非作者审查；只有授权守卫集成和后续团队流程完成后，Issue #9 才满足完整 Definition of Done。
