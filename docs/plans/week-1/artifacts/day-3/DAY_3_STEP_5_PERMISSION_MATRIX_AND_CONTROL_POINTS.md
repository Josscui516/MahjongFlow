# 第 3 天步骤 5：可实施权限矩阵与控制点

> 2026-10-20 最新写入例外：committee 可以通过不返回记录的受控函数按已知邮箱新增／取消报名、维护晚餐资格；完整名单仍仅 authorised 可读，原表读取 RLS 不放宽。安全员维护不再额外要求开发者能力，见[当前决定](../../../../project/MEMBER_WRITE_PRIVATE_READ.md)。

> 2026-10-20 用户批准晚餐操作例外：活跃 committee 也可通过目标活动的最小投影核验和发放；完整资格名册仍仅 authorised 可读，参与者／报名／签到原表权限不扩大，见[当前边界](../../../../project/DINNER_PERMISSION_BOUNDARIES.md)。下方原日期的晚餐 authorised-only 限制已被替代。

> 所属计划：[第 3 天：数据库、权限与隐私设计](../../DAY_3_DATA_SECURITY_AND_PRIVACY.md)
> 规则输入：[步骤 4：数据约束、状态与派生规则](DAY_3_STEP_4_CONSTRAINTS_STATES_AND_DERIVED_RULES.md)
> ERD 输入：[步骤 3：数据库 ERD 与关系说明](DAY_3_STEP_3_DATABASE_ERD.md)
> 页面输入：[第 2 天 P0 页面清单与信息架构](../day-2/DAY_2_STEP_5_PAGE_INVENTORY_AND_INFORMATION_ARCHITECTURE.md)
> 验收依据：[第 1 天 P0 用户故事与验收矩阵](../day-1/DAY_1_P0_ACCEPTANCE_MATRIX.md)
> 文档核对：2026-08-04 通过 Context7 核对 Supabase 官方 RLS、数据库函数和服务端 secret key 指南
> 状态：步骤 5 完成；字段级隐私清单在步骤 6 完成

## 1. 执行结论

已将 P0 角色边界转换为资源级 CRUD／敏感操作矩阵、页面路由控制、可信服务端
鉴权、Supabase RLS 策略方向、受限数据库函数和正反向权限测试。

权限模型采用四类调用上下文：

1. `committee`：可访问会议、任务、活动等非敏感协调数据；
2. `authorised`：继承 committee 权限，并可访问参与者、报名、签到及晚餐核验
   明细；秘书使用此能力级别；
3. 活动参与者／匿名请求：没有后台身份，也没有任何表级访问，只能向
   `/check-in/[token]` 的服务端入口提交当前操作所需信息；
4. server-only elevated client：只用于匿名签到、token 轮换和受控维护等无法
   使用用户 JWT 的窄操作；secret key 永不进入浏览器，并且只能调用专用函数，
   不允许业务代码任意查询敏感表。

前端可见性只是用户体验。每个敏感读取和写入均同时具有服务端控制与数据库
控制；未建立任何“只隐藏按钮”的权限。

## 2. 当前 Supabase 实施基线

依据当前 Supabase 官方文档，本项目采用以下规则：

- 所有位于 API 暴露 schema 的业务表显式 `ENABLE ROW LEVEL SECURITY`；启用
  RLS 后，没有匹配 policy 的 API 请求默认不能访问行；
- policy 显式使用 `TO authenticated` 或必要的受限角色，不依赖宽泛 public；
- `auth.uid()` 在未认证请求中返回 `NULL`，策略写为
  `(select auth.uid()) is not null` 并显式检查后台资料／角色；
- 对 `(select auth.uid())`、`event_id`、负责人和 policy 子查询字段建立所需索引；
- 普通后台请求使用携带当前用户 JWT 的 Supabase client，让 RLS 参与每次查询；
- `SECURITY DEFINER` 只在聚合或原子敏感操作确实需要时使用，并且必须
  `set search_path = ''`、全限定 schema、撤销默认 public execute 权限；
- secret key（旧称 service-role key）绕过 RLS，只能存在于安全服务端环境，
  不能暴露到浏览器、公开 bundle、日志或错误响应。

官方依据：

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase Auth Users and server-side secret key guidance](https://supabase.com/docs/guides/auth/users)

## 3. 角色与调用上下文

| 上下文 | 数据库会话 | 身份证明 | 能力边界 |
|---|---|---|---|
| 未登录／无 token | `anon` 或无数据库调用 | 无 | 登录页和安全公共错误；无业务表访问 |
| token 参与者 | 浏览器不直连业务表；Route Handler 内部调用 | 不可预测活动 token + 最小身份匹配输入 | 当前活动最小上下文和一次本人签到提交；不能读取名单或本人历史档案 |
| `committee` | `authenticated` + 用户 JWT | `auth.uid()` + `profiles.committee_role` | 非敏感协调数据及安全聚合数字 |
| `authorised` | `authenticated` + 用户 JWT | 同上，角色为 `authorised` | committee 能力 + 参与者／报名／签到／资格敏感操作 |
| server-only elevated | server secret／service role | 服务端环境与窄函数调用 | 只执行匿名签到、token 轮换或受控维护函数；不得作为普通后台 client |

持有活动 token 不会创建 Supabase Auth 会话，也不会成为 `authenticated`。token
只能作为某个受限服务端操作的能力凭证，不能进入后台或换取通用数据库访问。

## 4. 权限符号

| 符号 | 含义 |
|---|---|
| `R` | 读取资源 |
| `C` | 创建资源 |
| `U` | 更新资源 |
| `D*` | 仅为完成已批准更新所需的受控关系／子项删除；不是业务永久删除 |
| `D†` | 通过单用途受保护 RPC 执行、UI 二次确认的已批准永久删除；不授予表级直接 DELETE |
| `A` | 敏感或特权操作 |
| `Aggregate` | 只能读取固定结构的聚合数字，不能读取组成行 |
| `Own submit` | 只提交当前 token 操作所需的本人输入，不获得表行访问 |
| `—` | 拒绝；不创建 policy 或显式撤销权限 |

## 5. 资源级权限矩阵

### 5.1 认证与非敏感协调资源

| 资源／操作 | 未登录或 token 参与者 | `committee` | `authorised` | 数据库控制 |
|---|---|---|---|---|
| 登录／登出／当前会话 | 登录、本人会话操作 | 本人会话 | 本人会话 | Supabase Auth；业务表不保存凭据 |
| `profiles` 后台目录 | — | R：委员会安全目录字段 | R：同左 | `TO authenticated` + active backend role helper；无直接 app 写 policy |
| 修改账号资料、角色或状态 | — | 仅 `can_manage_accounts` | 仅 `can_manage_accounts` | 窄 `SECURITY DEFINER` RPC 再验证账号管理员；直接表写入保持拒绝 |
| 邀请／停用／恢复 Auth 用户 | — | 仅 `can_manage_accounts` | 仅 `can_manage_accounts` | 先验证用户会话与 profile 能力，再由 server-only Auth Admin 适配器执行 |
| 查看账号管理审计 | — | 仅 `can_manage_accounts` | 仅 `can_manage_accounts` | audit 表仅 SELECT policy；写入只来自受保护 RPC |
| `meetings` | — | C/R/U/D† | C/R/U/D† | backend policy；`created_by = auth.uid()`；永久删除走 `delete_meeting_record`，来源任务会阻断 |
| `meeting_attendees` | — | C/R/D* | C/R/D* | backend policy；复合键；不得删除最后一名参会人 |
| `discussion_points` | — | C/R/U；未被任务引用时 D* | 同左 | backend policy + source FK `RESTRICT` |
| `meeting_decisions` | — | C/R/U；未被任务引用时 D* | 同左 | backend policy + source FK `RESTRICT` |
| `tasks` | — | C/R/U/D† | C/R/U/D† | backend policy；单一负责人／来源／活动约束；永久删除走 `delete_task_record`，来源记录保留 |
| `events` 基础字段 | 仅 token 页经服务端得到最小片段 | C/R/U | C/R/U | backend policy；匿名无 table select |
| Dashboard／任务／活动派生数据 | — | R | R | 从可读协调表派生；不含个人参与数据 |

`profiles` 对普通后台成员保持直接只读，是为了让负责人选择和角色提示可用；
账号管理员的变更只能通过窄 RPC 完成并记录审计，不能获得直接表写权限。会议子项的 `D*` 仅用于更新会议内容，服务端必须
在同一事务中检查至少一名参会人和来源引用。会议与任务的 `D†` 是单独批准的永久删除边界，不扩展为通用表级删除权限。

### 5.2 敏感活动资源

| 资源／操作 | 未登录／无效 token | 有效 token 参与者 | `committee` | `authorised` | 数据库控制 |
|---|---|---|---|---|---|
| 活动最小签到上下文 | — | R：名称、时间、地点、窗口状态、是否要求学号 | R：活动详情 | R：活动详情 | token Route Handler + server-only RPC；匿名无 events select |
| `event_check_in_tokens` 行／摘要 | — | — | — | 不直接 R；A：生成、轮换、撤销 | table 默认拒绝；server-only RPC 返回一次性明文或非秘密元数据 |
| `participants` | — | Own submit：仅匹配输入，不读写表 | — | C/R/U | authorised RLS；anon／committee 无 policy |
| `registrations` 明细 | — | — | — | C/R/U（取消／恢复） | authorised RLS；无 delete |
| `attendance_records` 明细 | — | Own submit：只能触发本人当前签到 | — | C/R/U（补签／更正） | authorised RLS；匿名签到走 server-only RPC；无 delete |
| 报名人数／签到人数 | — | — | Aggregate | Aggregate + 可读明细 | hardened aggregate RPC，只返回 event ID 和数字 |
| 晚餐资格明细 | — | — | — | R；通过签到更正间接改变 | authorised RLS／server query；无资格写接口 |
| 按活动清理虚构测试数据 | — | — | — | — | 仅受控维护流程；不提供页面或普通 app policy |

普通委员会无法通过活动详情响应、直接表查询、RPC 参数或错误内容获取
`participant_id`、姓名、邮箱、学号、报名时间、签到时间、方式、操作者或个人
晚餐资格。

## 6. RLS helper 设计

### 6.1 Helper 职责

在非暴露的 `private` schema 定义最小 helper：

| Helper | 返回 | 用途 |
|---|---|---|
| `private.is_backend_user()` | 当前 `auth.uid()` 是否有 `committee` 或 `authorised` profile | 共享后台表 policy |
| `private.is_authorised()` | 当前 `auth.uid()` 的 role 是否为 `authorised` | 敏感表 policy |
| `private.current_profile_id()`（可选） | 非空且有效的当前 profile UUID | 统一审计字段与 policy 表达式 |

### 6.2 Helper 安全要求

- 默认优先 `SECURITY INVOKER`；只有为避免 profile policy 自引用或隐藏角色查询
  确实需要时才使用 `SECURITY DEFINER`；
- 任何 definer helper 均 `STABLE`（适用时）、`set search_path = ''`，并在函数体
  中使用 `public.profiles`、`auth.uid()` 等全限定对象；
- `REVOKE EXECUTE ... FROM PUBLIC, anon`，只向 `authenticated` 授予所需执行权；
- 返回布尔值或当前用户 ID，不返回 profile 行、邮箱或角色表内容；
- policy 中使用 `(select private.is_backend_user())`、
  `(select private.is_authorised())` 和 `(select auth.uid())`，避免逐行重复求值；
- `profiles.id` 是主键；其他用于 policy 的 `event_id`、`assignee_id`、
  `created_by`、`recorded_by` 均建立匹配索引。

## 7. RLS policy 模板方向

以下是 migration 必须实现的 policy 语义，不是本步骤创建的 SQL。

### 7.1 共享后台表

适用于 `profiles`（只读）、`meetings`、`meeting_attendees`、
`discussion_points`、`meeting_decisions`、`tasks` 和 `events`：

| 操作 | `USING` 方向 | `WITH CHECK` 方向 | 补充控制 |
|---|---|---|---|
| SELECT | `(select private.is_backend_user())` | N/A | 只向 `authenticated` 授权 |
| INSERT | N/A | backend 且 `created_by = (select auth.uid())`（有该列时） | 服务端字段白名单；审计列不能客户端覆盖 |
| UPDATE | backend | backend；创建者和来源字段保持不可变 | before trigger／受限 RPC 防止改审计／来源列 |
| DELETE | 默认无 policy | 默认无 policy | 仅必要关系／子项 D* 或已批准永久删除 D† 通过窄函数；不授予表级直接 DELETE |

`profiles` 不创建 app INSERT／UPDATE／DELETE policy。`meeting_attendees` 没有
`created_by`，服务端先验证目标会议可访问；`D*` 必须检查不会移除最后一名
参会人。讨论点／决策的 `D*` 还受来源任务外键阻止。

### 7.2 敏感表

适用于 `participants`、`registrations` 和 `attendance_records`：

| 操作 | `USING` 方向 | `WITH CHECK` 方向 | 补充控制 |
|---|---|---|---|
| SELECT | `(select private.is_authorised())` | N/A | committee 与 anon 没有 policy |
| INSERT | N/A | authorised；审计人等于 `(select auth.uid())`（适用时） | 规范化、唯一和条件字段规则 |
| UPDATE | authorised | authorised；审计字段按服务端当前用户写入 | 状态转换白名单；无资格字段 |
| DELETE | 无 policy | 无 policy | 取消／void 使用 UPDATE；测试清理走维护流程 |

对 `attendance_records`，直接 authenticated INSERT 只允许授权人工路径。QR
参与者没有 INSERT policy，也不能直接调用 Supabase table endpoint。

### 7.3 Token 表

`event_check_in_tokens` 对 `anon`、`authenticated` 和浏览器 client 不建立直接
SELECT／INSERT／UPDATE／DELETE policy，也不授予表操作权限。authorised 用户
通过受保护 Route Handler 请求生成、轮换或撤销；服务端再次验证用户 JWT 和
`private.is_authorised()` 后，才用 server-only secret 调用窄数据库函数。

函数只返回：

- 生成时一次性的完整 URL／token；
- 非秘密状态，如 `created_at`、`revoked_at`、是否 active；
- 不返回 `token_digest`、其他活动 token 或创建者的额外资料。

## 8. 固定结构的安全聚合

普通委员会读取活动人数只能调用
`public.get_event_participation_totals(event_ids uuid[])` 或等价窄函数。

### 8.1 返回结构

| 字段 | 类型 | 是否允许包含个人数据 |
|---|---|---|
| `event_id` | `uuid` | 否；只标识委员会本就可读的活动 |
| `registration_count` | 非负整数 | 否；只统计 `registered` |
| `attendance_count` | 非负整数 | 否；只统计 `confirmed` |

禁止加入 `participant_id`、姓名、邮箱、学号、报名／签到时间、方式、状态明细、
晚餐资格或小样本参与者提示。

### 8.2 聚合函数控制

- `TO authenticated`，函数内先验证 `auth.uid() IS NOT NULL` 与 backend role；
- 只接受调用者本来可读的 event ID；不存在和不可访问 event 返回同一种安全
  空结果／拒绝；
- 如使用 `SECURITY DEFINER`，固定空 `search_path`、全限定关系、撤销 public／
  anon execute，只授予 authenticated；
- 不创建让 committee 直接 SELECT registrations／attendance 的 view；
- 为两个敏感表的 `event_id + status` 建索引，避免聚合函数造成全表扫描；
- authorised 也可使用相同聚合函数，但其明细读取仍走单独授权路径。

## 9. 匿名签到的服务端边界

### 9.1 选定架构

```text
PG-03 browser
  → Next.js Route Handler（无 Supabase secret 输出）
    → rate limit + input size/shape validation
      → server-only Supabase client
        → restricted RPC（token/context 或 submit check-in）
          → PostgreSQL atomic validation/write
```

浏览器不获得 secret key，不直连 `events`、`participants`、`registrations`、
`attendance_records` 或 token 表。发布用 Supabase URL／publishable key 即使存在于
客户端，也没有这些表的 anon policy 或函数执行权。

### 9.2 专用函数

| 函数方向 | 调用者 | 输入 | 输出 | 表级效果 |
|---|---|---|---|---|
| `public.get_check_in_context(token)` | server-only | token | 活动名称、时间、地点、窗口状态、`student_id_required` 或统一不可用结果 | 只读；不返回活动 ID 以外的内部标识或任何参与者信息 |
| `public.submit_event_check_in(token, email, student_id?)` | server-only | 当前提交最小字段 | `success`、`already_processed` 或统一失败 | 原子验证并最多创建一条 confirmed QR 签到 |
| `public.rotate_event_check_in_token(event_id, actor_id)` | server-only，先验证 authorised JWT | 活动与当前用户 | 一次性新 token／URL | 原子撤销旧 token 并创建摘要 |

这些 RPC 位于 Data API 可调用的 `public` schema，但不授予 `PUBLIC`、`anon`
或普通 `authenticated` 执行权，只授予必要的 server role；角色 helper 仍保留
在非暴露的 `private` schema。RPC 如为 `SECURITY DEFINER`，必须固定空
`search_path` 并全限定所有对象；函数内部仍执行步骤 4 的 token、窗口、活动
状态、报名、参与者、唯一签到和审计校验。

server-only secret 绕过 RLS，因此代码规范必须禁止使用该 client 实现普通后台
列表、详情或表单。普通后台一律使用用户 JWT client；secret client 只能封装在
单独模块，导出三个窄操作，不导出通用 `.from()` client。

## 10. 页面与服务端控制点

| 页面／入口 | 前端控制 | 服务端控制 | 数据库控制 |
|---|---|---|---|
| PG-01 `/` | 无数据展示 | 验证会话并安全重定向 | 无业务读取 |
| PG-02 `/login` | 统一错误、禁用重复提交 | Auth 登录；不枚举账号 | Supabase Auth |
| PG-03 `/check-in/[token]` | 不显示后台导航／名单；只收最小输入 | token、窗口、活动、报名、参与者、重复、限速全部重验 | server-only RPC；唯一签到；anon 无表 policy |
| PG-04 Dashboard | 仅协调数据和安全数字 | 有效后台会话 | backend RLS + aggregate RPC |
| PG-05–07 Meetings | 隐藏无关操作 | backend 会话、输入和来源验证 | backend RLS、FK、事务 |
| PG-08–10 Tasks | 单负责人、只读来源 | backend 会话、来源重读、字段白名单 | backend RLS、来源约束／唯一性 |
| PG-11–13 Events | committee 不渲染敏感入口 | backend 会话；敏感 token 操作要求 authorised | events RLS；token table deny；aggregate RPC |
| PG-14 Registrations | authorised-only shell | authorised 会话；资源和字段校验 | sensitive RLS、唯一报名 |
| PG-15 Attendance | authorised-only shell | authorised 会话；原状态／目标状态校验 | sensitive RLS、唯一签到、审计检查 |
| PG-16 Dinner | authorised-only shell；无资格编辑控件 | authorised 会话；实时查询当前签到 | sensitive RLS；资格无可写列 |
| `/admin/users` 账号管理 | 仅账号管理员显示入口；密码永不显示 | active backend 会话 + `can_manage_accounts`；Auth Admin secret 仅服务端 | profile 管理 RPC、最后管理员保护、append-only audit；直接表写拒绝 |

所有 Route Handler／Server Action 在查询前验证会话和角色。敏感路由不能先用
elevated client 取回数据再在 React 中隐藏；拒绝必须发生在查询之前。

## 11. 安全拒绝与错误合同

### 11.1 后台请求

| 场景 | 外部结果 | 禁止内容 |
|---|---|---|
| 无会话访问后台 | 跳转登录或 `401` | 后台页面数据、内部查询结果 |
| committee 访问 PG-14–16 | 固定 `403`／安全返回路径 | 是否存在某参与者、活动敏感行数 |
| 无权限访问具体敏感 ID | 统一 `404 resource unavailable` 或等价固定拒绝 | 区分“不存在”与“存在但无权” |
| RLS 返回空 | 服务端按资源合同转为安全结果 | 把空行解释成某参与者不存在并回显 |
| 输入错误 | 只返回调用者提交字段的格式提示 | SQL、policy 名、约束名、内部 ID、其他人的值 |

### 11.2 Token 签到

| 场景 | 外部结果 | 数据库效果 |
|---|---|---|
| token 格式错误、摘要不匹配、撤销、错误活动或窗口无效 | 同一 “Check-in unavailable” | 无写入 |
| email／student ID 无匹配或无有效报名 | 同一 “Unable to process check-in; contact staff” | 无写入 |
| 首次有效提交 | “Check-in successful” | 一条 confirmed QR 签到 |
| 已有 confirmed／voided 签到 | “Already processed; contact staff if correction is needed” | 不插入、不恢复、不泄露状态 |
| 限速 | 通用 `429` 与稍后重试 | 无敏感查询或写入 |
| 系统失败 | 通用可恢复错误 + correlation ID | 事务回滚 |

日志只记录 correlation ID、路由、结果类别、耗时和必要的非个人安全指标；不得
记录完整 token、email、student ID、参与者 UUID、请求正文或资格结果。

## 12. RLS 与权限测试矩阵

测试至少准备 `committee`、`authorised`、已认证但无有效 profile、匿名、有效
token、无效／撤销 token 六种上下文，全部使用虚构资料。

### 12.1 正向场景

| ID | 会话 | 操作 | 预期 |
|---|---|---|---|
| PERM-P01 | committee | 读取／创建／更新会议、任务和活动 | 成功；审计人为当前用户 |
| PERM-P02 | committee | 读取活动报名数和签到数 | 只返回 event ID 与两个数字 |
| PERM-P03 | authorised | 执行 PERM-P01 | 成功 |
| PERM-P04 | authorised | 创建参与者与报名、取消／恢复报名 | 成功；唯一行和记录人正确 |
| PERM-P05 | authorised | 查看签到明细、人工补签、void／恢复 | 成功；操作者与更新时间正确 |
| PERM-P06 | authorised | 查看晚餐资格 | 只读结果与当前签到一致 |
| PERM-P07 | authorised | 生成／轮换签到 token | 旧 token 失效；新明文仅返回一次 |
| PERM-P08 | 有效 token | 加载 PG-03 最小活动信息 | 只返回名称、时间、地点、窗口状态和是否要求学号 |
| PERM-P09 | 有效 token + 有效虚构报名 | 首次签到 | 一条 confirmed QR 签到；仅本人当前操作结果 |
| PERM-P10 | 有效 token + 已有签到 | 重复／并发提交 | 幂等结果；仍只有一条签到 |

### 12.2 反向场景

| ID | 会话 | 操作 | 预期 |
|---|---|---|---|
| PERM-N01 | anonymous | 直接 SELECT 任一业务表 | RLS／grant 拒绝，无行 |
| PERM-N02 | token participant | 请求会议、任务、profile 或名单 endpoint | 拒绝，无内部数据 |
| PERM-N03 | committee | 直接 SELECT participants／registrations／attendance | RLS 拒绝，无行 |
| PERM-N04 | committee | 调用晚餐资格或 token 管理 | 服务端与数据库函数权限均拒绝 |
| PERM-N05 | committee | 通过活动聚合 RPC 注入任意 event／参数 | 只处理可读活动；返回结构无个人字段 |
| PERM-N06 | committee／authorised | 修改自己的 `committee_role` | 拒绝；角色不变 |
| PERM-N07 | authenticated 无 profile | 访问后台表、页面和 RPC | 全部拒绝 |
| PERM-N08 | 无效／撤销／过期 token | 加载或提交签到 | 统一拒绝；无写入 |
| PERM-N09 | 有效 token + 错误 email／student ID | 反复探测 | 统一拒绝并限速；不泄露存在性 |
| PERM-N10 | 有效 token | 直接 INSERT attendance_records | 无 anon policy／grant，拒绝 |
| PERM-N11 | authorised | 尝试直接写晚餐资格或 Overdue | schema 无字段／接口，拒绝 |
| PERM-N12 | authorised | 尝试删除报名／签到以纠错 | 无 delete policy；必须使用 cancelled／voided 更新 |
| PERM-N13 | 浏览器 bundle | 搜索 secret／service-role key | 不存在；只有 publishable 配置 |
| PERM-N14 | server-only RPC | 提交跨活动 token／参与者组合 | 原子拒绝；无写入 |

### 12.3 三层验证要求

每个敏感场景至少执行：

1. 直接访问页面 URL；
2. 绕过 UI 直接请求 Route Handler／Server Action；
3. 使用对应 anon／authenticated JWT 直接调用 Supabase table 或 RPC；
4. 检查数据库最终行和审计字段；
5. 检查响应、服务器日志和浏览器网络内容无敏感泄露。

UI 不显示按钮只能作为附加证据，不能替代第 2–5 项。

## 13. Migration 与代码实施输入

### 13.1 Migration 必须包含

- 所有 exposed 业务表 `ENABLE ROW LEVEL SECURITY`；
- 最小 table／column grants 和每项 SELECT／INSERT／UPDATE／必要 D* policy；
- `private` schema 与 hardened role helper；
- 安全聚合函数、token／签到专用函数的固定 `search_path` 和 execute revoke／grant；
- policy 与函数查询需要的索引；
- 无 participants／registrations／attendance／token 的 anon policy；
- 无 profiles role update policy；
- 无报名、签到、token、任务、活动和会议主记录的普通 delete policy；
- 普通委员会聚合返回类型固定且无个人字段；
- 角色、匿名、直接数据库和函数权限的 SQL 测试。

### 13.2 应用代码必须包含

- 用户 JWT client 与 server-only elevated client 分离模块；
- elevated client 不导出通用查询能力，只封装经批准的窄 RPC；
- 每个受保护 Route Handler／Server Action 的会话和角色检查；
- PG-03 限速、输入上限、统一错误合同和 correlation ID；
- 敏感响应 DTO 白名单，禁止把数据库整行直接序列化；
- 角色／字段变化后的缓存失效，避免旧敏感页面继续显示；
- secret key 扫描、RLS 测试和直接请求集成测试。

## 14. 尚未完成但不阻塞本步骤的事项

- 字段级公开／内部／敏感／高度敏感分类由步骤 6 完成；
- RLS SQL、函数和测试文件在数据库 migration 实施周创建；
- server secret 的实际环境变量名称在第 4 天 `.env.example` 中只记录变量名，
  不写真实值；
- 数据保留期限仍待 Stakeholder 在上线前确认；
- 团队审查与两角色实际测试必须在实现后进行，本文不是测试通过证明。

## 15. 步骤 5 完成检查

- [x] 已按资源和四类调用上下文建立详细权限矩阵；
- [x] 已分别标记读取、创建、更新、受控删除和敏感操作；
- [x] 普通委员会可访问非敏感会议、任务和活动协调数据；
- [x] 普通委员会只能通过固定聚合函数读取报名数和签到数；
- [x] 只有 authorised 可访问参与者、报名、签到与晚餐资格明细；
- [x] 活动参与者只能通过 PG-03 服务端入口提交本人最小匹配信息；
- [x] 所有敏感操作均定义前端、服务端和数据库／RLS 控制点；
- [x] token 表和敏感表对 anon／committee 默认拒绝；
- [x] 拒绝与签到响应不泄露参与者是否存在或具体失败原因；
- [x] 已覆盖页面、接口、直接数据库和日志的正向／反向测试场景；
- [x] 已按当前 Supabase 官方指南定义 RLS、definer function 和 secret key 安全基线；
- [x] 未把隐藏前端按钮视为权限实现，也未增加 P1／Post-MVP 能力。
