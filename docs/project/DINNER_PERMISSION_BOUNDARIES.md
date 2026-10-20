# 晚餐核验与完整资格名册权限分离

2026-10-20 用户明确确认：所有有效委员会成员均可在 Dinner verification 核验与记录发放；Dinner eligibility roster 的完整名单与 Registrations 一样，仅安全员 authorised 可查看。本决定替代之前将核验也限制为 authorised、将名册查看限制为管理员的解释。继续关联 Issue #102／PR #103，独立于二维码管理员权限 PR #101。

## 当前权限

| 操作 | 普通 committee | 安全员 authorised | authorised 且有账号管理能力 |
|---|---|---|---|
| 本场晚餐核验、查看可领取与已发放人员 | 允许 | 允许 | 允许 |
| 本场勾选发放、确认清除误勾 | 允许 | 允许 | 允许 |
| 完整通用资格名册 | 拒绝 | 只读 | 允许 |
| 增加／恢复／停用通用资格 | 拒绝 | 拒绝 | 允许 |
| 报名／签到原始明细 | 拒绝 | 保留既有权限 | 保留既有权限 |

匿名、停用或缺少有效后台资料的用户均拒绝。普通成员可见的只是目标活动当前可领取或已经发放的最小身份投影，不提供全部通用名单、学号、操作人或其他活动资料。

## 实现与部署

新增 `20261020014008_separate_dinner_distribution_and_roster_permissions.sql`。`list_event_dinner_service` 改为固定 search_path 的 SECURITY DEFINER，并显式检查 private.is_backend_user，返回指定活动所需的身份、当前资格及发放时间。`set_event_dinner_issued` 同样检查活跃后台成员，保留真实 auth.uid、当前资格锁与幂等校验。两个函数仍撤销 public／anon execute，仅 authenticated 可执行。

通用名册、参与者、报名、签到和发放原表的 RLS、列写权限不放宽。使用受控函数投影，是为了让普通成员完成发放而不获得原始敏感表权限。原 `list_matched_dinner_attendees` 的安全员限制仍保留，供原有受保护用途使用。

核验 layout、活动选择／详情、读取服务和发放服务统一改为 requireBackendUser；活动详情的晚餐入口对所有后台成员可见。名册 layout、页面和读取服务继续 requireAuthorised，安全员可只读查看；服务器写入继续额外检查 canManageAccounts。侧栏仍将完整名册放在 Registrations 同组，仅安全员可见。

按时间顺序应用待执行 migration 后再发布前端，已有数据库不得 reset。新迁移只替换函数，不改任何人资格、签到或发放记录；函数签名不变，生成类型已通过 CLI 重核，无差异。回退先撤下允许普通成员核验的新前端，再用前向迁移恢复两个函数的原 authorised 检查／读取实现，保留所有数据。回退会恢复普通成员不能发放的旧限制，须业务确认。

## 验证

- 全量应用测试 929 passed、3 skipped；包括两类活跃角色布局、菜单、活动入口、只读名册、服务端失败与身份边界。
- 干净隔离库重放所有迁移和虚构 seed：19 个 SQL 文件／499 项断言通过，其中晚餐 33 项覆盖普通成员通过受控投影核验／发放、完整名册拒绝及匿名／停用拒绝。
- ESLint、TypeScript、数据库 schema lint、Docker 生产构建通过。
- Chrome／Playwright 实际使用虚构账号依次切换普通成员、非管理员安全员：普通成员能从活动进入晚餐核验、发放并刷新保留；不能查看完整名册；非管理员安全员可查看完整名单但没有增删控件；匿名请求跳回登录。测试资料已清理。

本会话没有 Browser 插件及 browser skill，按 frontend-testing-debugging 指引用 Playwright／Chrome 验证。没有修改远程库、合并 PR 或变更 Project 状态。
