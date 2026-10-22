> 2026-10-22 最新决定：General 不得新增／移除长期晚餐资格，仅 Secretary 可操作，取代下文旧例外。见[权限决定](SECRETARY_ONLY_DINNER_ROSTER.md)。

# General 活动运营权限收紧

## 2026-10-21 用户决定

General Committee Member 对应 `committee`。用户明确要求移除活动页的 Registration Management、Dinner Verification 按钮，并禁止 General 访问这两个功能。本决定取代先前允许普通成员提交报名和进行活动晚餐核验的例外，属于 US-05、US-06 的权限修正。

| 操作 | 活跃 committee | 活跃 authorised |
|---|---|---|
| 活动详情查看、编辑、筹备任务、安全人数汇总 | 保持原权限 | 保持原权限 |
| 报名管理页面、按邮箱新增／取消报名 | 拒绝 | 允许 |
| 活动晚餐核验页面、读取核验名单、发放／清除误勾 | 拒绝 | 允许 |

`canManageAccounts` 不替代 authorised 业务角色。匿名、停用、缺少有效资料的账号仍被拒绝。本次不调整独立 Dinner eligibility roster 的已知邮箱提交能力、二维码管理或参与者扫码签到。

## 控制点

- 活动详情仅 authorised 渲染两个入口。
- `/registrations`、`/registrations/[eventId]`、`/dinner-verification`、`/dinner-verification/[eventId]` 各自检查权限；layout 也拒绝普通成员，页面不依赖 layout 独自保护数据。
- 报名提交 action 在创建数据库客户端前检查 authorised；晚餐读取、刷新及发放通过 authorised 服务执行。
- 数据库 `list_event_dinner_service`、`set_event_dinner_issued` 显式检查 `private.is_authorised()`；`submit_member_list_change` 的 registration 分支同样检查，dinner 名册分支保持原边界。
- 参与者、报名、签到、晚餐原表既有 RLS 保持限制；不新增表、外键、索引或约束，不改函数签名和返回类型。

## 发布与回退

先应用 `20261021074810_restrict_general_event_operations.sql`，再发布应用。已有库禁止 reset。本地已应用并通过 Supabase CLI 重新生成 `public,graphql_public` 类型核对，结果无差异。尚未应用到远程环境。

迁移只收紧函数权限判断，不删除、回填或改写已有报名、签到、资格或发放数据；seed 不变。回退需要业务负责人重新批准普通成员访问，通过新的前向迁移恢复旧函数检查，再恢复对应页面和服务端入口。不得靠删除业务记录或修改历史迁移回退。

## 验证

- 相关 Vitest：201 项通过、8 项条件集成测试跳过；覆盖入口隐藏、General 页面拒绝、action 调用前拒绝、晚餐服务拒绝及 authorised 正常路径。
- 本地 SQL：报名／独立名册 23 项、晚餐核验 35 项通过；覆盖 General 直接 RPC 拒绝、无管理员能力的 authorised 可操作、匿名和停用拒绝、已有发放事实保留。
- Chrome 当前 General 会话：活动页两个按钮不可见；直接访问报名管理、晚餐核验详情均显示无权访问。

- ESLint、TypeScript、生产构建、数据库 schema lint 通过。全量 Vitest 为 1003 项通过、18 项跳过、3 项失败；失败均位于未修改的会议列表测试，期待 pageSize=8 而当前页面使用 10，本轮未越界修改。
