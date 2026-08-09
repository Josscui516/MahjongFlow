# Xuanwei：课程第 3 周（开发第 2 周）独立工作计划

所属统一周计划：[认证、权限与数据基础](WEEK_2_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Joshua 的认证输出](JOSHUA_WEEKLY_WORK_PLAN.md)和 [Li 的 schema 输出](LI_WEEKLY_WORK_PLAN.md)。独立开发阶段使用冻结的用户与 schema 合同，不等待其实现完成。

## 1. 独立目标

独立完成 Issue #40，包括角色 helper、最小 grants、RLS policies、服务端授权守卫和权限测试，覆盖 X-04、X-05、X-06。工作期间不改写前两个 migration、认证页面、共享 UI 或测试基础配置。

## 2. 工作包与文件所有权

- 成员姓名：Xuanwei；
- GitHub Assignee：`YUHAN2233`；
- 独立工作包：WP-C RLS 与服务端授权；
- 主要 Issue：#40；父 Issue 为 #10；
- GitHub Sprint：`Sprint 2`；
- Sprint 集成分支：`sprint/2-auth-foundation`；
- Issue 分支：`feature/40-rls-authorisation`；
- 成员 PR base：`sprint/2-auth-foundation`；
- Sprint 总 PR 主要 Issue：#41；
- 允许修改：第三个新 timestamped migration、`src/lib/auth/authorization.ts`、`supabase/tests/rls/`；
- 禁止修改：前两个 migration、seed、认证路由、共享组件、CI／验收配置；
- 固定输入合同：冻结表／列名；`AuthenticatedUser { id }`；`AccessContext { userId, role }`；
- 输出合同：`requireBackendUser()`、`requireAuthorised()`、角色 helper、policies 和 RLS 测试；
- 集中非作者审查人：Li，只在完成后审查一次。

## 3. 开始条件

- Week 1 权限矩阵和资源 CRUD 规则已冻结；
- Li 的 schema 合同足以离线编写第三个 migration；
- Joshua 的 `AuthenticatedUser` 合同已冻结；
- 测试可使用 mock JWT／fixture 独立运行；
- 普通请求禁止使用 service secret 绕过 RLS。

## 4. 独立执行步骤

### 步骤 1：建立角色与策略基线

执行：

1. 创建第三个 `add_mvp_rls_helpers_policies_and_rpcs` migration；
2. 实现最小 `is_backend_user()` 和 `is_authorised()`；
3. 固定 definer 函数 search path，先撤销再最小 grant；
4. 为协调表和敏感表分别建立 backend／authorised policies。

产出：RLS、grants 和 helper migration。

检查：anon、无 profile 和 committee 的敏感查询默认被拒绝。

### 步骤 2：实现服务端授权合同

执行：

1. 基于 `AuthenticatedUser` 实现 profile／role 查询；
2. 实现 `requireBackendUser()` 和 `requireAuthorised()`；
3. 返回冻结的 `AccessContext`，不包含敏感 profile 字段；
4. 使用 stub 验证 Shiying 可在不读取数据库明细的情况下消费。

产出：服务端授权模块和 `AccessContext` 类型。

检查：客户端状态、URL 或 metadata 不能改变服务端角色结果。

### 步骤 3：个人权限测试

执行：

1. 覆盖 committee、authorised、anon 和无 profile 上下文；
2. 覆盖自提权、审计字段伪造和未授权函数执行；
3. 验证拒绝响应不泄露参与者是否存在；
4. 运行 db lint、RLS tests、typecheck 和授权模块测试。

产出：X-04–06 与反提权个人证据。

检查：允许场景成功，拒绝场景无返回行、无写入、无敏感泄露。

### 步骤 4：一次性交接

执行：

1. 在单次集成时将第三个 migration 应用于 Li 的 schema；
2. 接入 Joshua 的真实当前用户函数，不修改其文件；
3. 向 Shiying 交付 `AccessContext`，向 Yubo 交付权限测试命令；
4. 将接口不一致记录为变更请求，由原所有者处理。

产出：授权交接包。

检查：其他工作包只消费公开合同即可集成。

## 5. 低频沟通规则

- 周初冻结 schema、`AuthenticatedUser` 和 `AccessContext`；
- 使用 stub 独立开发，不持续等待 Joshua 或 Li；
- 只有 schema 无法支持 policy、认证合同无法验证用户或发生权限泄露时沟通；
- 不直接修改 Joshua、Li 或 Shiying 文件；
- 完成后接受 Li 一次集中审查。

## 6. 个人交付物

- 第三个 RLS／grants／helper migration；
- 服务端角色与授权守卫；
- `AccessContext` 输出合同；
- `supabase/tests/rls/` 和 X-04–06 证据；
- 权限矩阵实测与交接说明。

## 7. 个人验收清单

- [ ] committee、authorised、anon、无 profile 符合权限矩阵；
- [ ] 用户不能自提权或伪造审计字段；
- [ ] 只修改允许文件范围；
- [ ] 输出符合 `AccessContext` 合同；
- [ ] 未使用 service secret 绕过普通请求；
- [ ] db lint、RLS tests、typecheck 和模块测试通过；
- [ ] 交接包可独立消费；
- [ ] 成员 PR 只关联 #40 并合并到 `sprint/2-auth-foundation`；
- [ ] Review 发现已区分 #40 policy／授权缺陷与 #39 schema 或 #9 会话输出缺陷；
- [ ] 合并后 #40 保持 `Testing`，未提前关闭；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| Helper 自引用或 grant 过宽 | 递归或越权 | RLS test 失败或 anon 获得能力 | 立即修复并触发安全沟通 | Xuanwei | 个人验收前 |
| 冻结 schema 缺少 policy 索引 | 性能或测试阻断 | 无法通过已批准测试 | 向 Li 提变更请求，不修改其 migration | Xuanwei／Li | 集成检查点 |

## 9. 未完成项处理

- 敏感泄露、自提权或 anon 访问立即升级；
- schema／认证不兼容只提交变更请求，不跨界修改；
- 非阻断性能改进进入 backlog；
- 未通过 X-04–06 不进入集成。

## 10. 周末交接

- 已完成：RLS、grants、helper、授权守卫和权限测试；
- 未完成：按实际结果记录；
- 输出合同：`AccessContext`、两个授权守卫和测试入口；
- 集成注意事项：普通后台请求必须携带用户 JWT；
- Sprint PR 纳入证据：#40 的 RLS allow/deny、反提权、授权模块、review 和回滚摘要；
- 下周建议：会议模块直接调用后台守卫并依赖 RLS。
