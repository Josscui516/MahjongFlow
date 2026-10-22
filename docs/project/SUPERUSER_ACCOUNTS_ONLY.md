# Superuser 账户管理边界

用户于 2026-10-22 批准：拥有 `can_manage_accounts` 的活跃账号作为账户管理专用 Superuser，导航只显示 Accounts，不能使用协调和参与者功能。`committee_role` enum 保留，账户管理权限不代表参与者数据访问权。普通成员权限保持原规则。

应用层通过协调服务授权函数拒绝 Superuser，入口导航链接指向 Accounts。数据库 migration `20261021140000_superuser_accounts_only.sql` 收紧 `private.is_backend_user()`、`private.is_authorised()` 及四个 QR 管理函数；保留账户管理专用检查，并保留账户管理员读取 profiles 的 policy。没有新增表、索引、约束或数据转换。先应用 migration，再发布应用；本轮仅本地应用。

回退时通过新增 migration 将上述六个函数恢复至前一版本，再恢复应用授权与导航；不得 reset 数据库。恢复旧权限属于扩大访问，须由负责人批准。
