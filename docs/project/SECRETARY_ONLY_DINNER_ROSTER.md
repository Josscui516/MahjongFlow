> 2026-10-22 后续决定：独立 dinner-roster 页面及其维护功能已移除，本页仅保留历史权限决定。现行活动晚餐发放继续使用确认到场清单。

# 长期晚餐资格仅限 Secretary 维护

2026-10-22 用户决定：General 不得新增或移除长期晚餐资格，只有 Secretary（`authorised` 且无账户管理能力）可以操作。本决定取代旧文档中普通成员按已知邮箱提交名册变更的例外，属于 US-06 权限修正。

- `/dinner-roster` 的 layout 和 page 都使用 `requireAuthorised`；移除 General 专用提交表单。
- `submitMemberListChange` 对报名与晚餐名册均要求 `requireAuthorised`，在建立数据库客户端之前拒绝 General。
- `submit_member_list_change` 统一要求 `private.is_authorised()`；现有表级 RLS 保持 Secretary 专属，Admin、匿名、停用账户均无新增权限。
- 不新增表、外键、约束或索引，不变更 RPC 签名，不删除或转换已有资格及发放记录；生成类型通过工具重新核对。

## 发布与回退

先应用 `20261021142020_enforce_secretary_dinner_roster.sql`，再发布应用。前一条 `20261021141951` 是无操作迁移。已有数据库禁止 reset。本轮仅应用本地数据库，远程尚未发布。

如需回退，必须先取得扩大权限的明确批准，再新增前向迁移恢复旧函数的 dinner 分支授权，并恢复页面及 action；不得删除业务数据或改写历史迁移。

## 验证

使用虚构数据验证 General 直接 RPC 新增与移除被拒绝、Secretary 新增／移除成功、匿名与停用账户拒绝；服务端回归测试确认无权请求在建立数据库客户端前被拒绝。
