# Li：课程第 3 周（开发第 2 周）独立工作计划

所属统一周计划：[认证、权限与数据基础](WEEK_2_IMPLEMENTATION_PLAN.md)

直接依赖文档：无。schema 直接依据 Week 1 已批准 ERD 和冻结 Auth UUID fixture 独立实现；完成后由 [Xuanwei](XUANWEI_WEEKLY_WORK_PLAN.md)消费。

## 1. 独立目标

独立完成 Issue #39，建立 7 个状态类型、11 个核心表、外键、约束、索引、触发器、匿名化 seed 和数据库生成类型。工作期间不实现 RLS policies、应用认证、共享 UI 或验收框架。

## 2. 工作包与文件所有权

- 成员姓名：Li；
- GitHub Assignee：`Kaia-Zhang`；
- 独立工作包：WP-B Schema 与约束；
- 主要 Issue：#39；父 Issue 为 #10；
- GitHub Sprint：`Sprint 2`；
- Sprint 集成分支：`sprint/2-auth-foundation`；
- Issue 分支：`feature/39-schema-baseline`；
- 成员 PR base：`sprint/2-auth-foundation`；
- Sprint 总 PR 主要 Issue：#41；
- 允许修改：前两个新 timestamped migration、`supabase/seed.sql`、`supabase/tests/constraints/`、`src/types/database.generated.ts`；
- 禁止修改：第三个 RLS migration、`src/lib/auth/`、应用路由、共享组件、CI／验收配置；
- 固定输入合同：Week 1 ERD、表／列名、`committee_role` enum、两个固定虚构 Auth UUID；
- 输出合同：可重放 schema、稳定 fixture、生成类型和数据库验证命令；
- 集中非作者审查人：Xuanwei，只在完成后审查一次。

## 3. 开始条件

- ERD、字段、约束和删除行为已冻结；
- 本地 Supabase 和空基线 migration 可 reset；
- 两个虚构 Auth UUID 的建立方式可重复；
- 前两个 migration 的文件所有权已确认；
- 远程数据库不在本工作包范围。

## 4. 独立执行步骤

### 步骤 1：创建类型、表和默认拒绝基线

执行：

1. 创建 `create_mvp_types_and_tables` migration；
2. 建立 private schema、7 个类型和 11 个表；
3. 按外键拓扑落实主键、外键和 nullability；
4. 每个 public 表创建后立即启用 RLS，但不创建 policy。

产出：第一层 schema migration。

检查：空库应用成功；所有表启用 RLS；anon／authenticated 默认无表访问。

### 步骤 2：创建约束、索引、触发器与 seed

执行：

1. 创建 `add_mvp_constraints_indexes_and_triggers` migration；
2. 实现唯一性、状态、文本、时间窗口、来源关系和审计规则；
3. 添加外键和后续 RLS 查询所需索引；
4. 建立两个虚构 profile 和最小业务 seed；
5. 不生成可用签到 token，不写入真实数据或密码。

产出：第二层 migration 和匿名化 seed。

检查：重复、无效状态和不合法关系被数据库拒绝；连续 reset 稳定。

### 步骤 3：个人数据库验证

执行：

1. 编写主外键、唯一性、检查约束和默认拒绝测试；
2. 运行无 seed reset、完整 seed reset、migration list 和 db lint；
3. 运行 database tests 和 schema diff；
4. 生成 `database.generated.ts` 并运行 typecheck。

产出：数据库个人验证证据和生成类型。

检查：reset、lint、tests、diff 和 typecheck 全部通过。

### 步骤 4：一次性交接

执行：

1. 整理表／列、enum、索引、fixture ID 和验证命令；
2. 将前两个 migration 标记为不允许其他成员改写；
3. 向 Xuanwei 交付 schema 合同，向 Yubo 交付测试命令；
4. 集成第三个 migration 后只重新生成类型和运行验证，不修改 Xuanwei 文件。

产出：schema／fixture 交接包。

检查：Xuanwei 能仅凭合同编写 policy，Yubo 能独立 reset 和验证。

## 5. 低频沟通规则

- 周初只确认 ERD、Auth UUID 和文件边界；
- 工作期间不参加认证或 UI 日常同步；
- 只有冻结 ERD 无法迁移、Auth fixture 无法建立或发现数据安全问题时沟通；
- Xuanwei 的变更请求由 Li 在前两个 migration 中处理，Xuanwei 不直接修改；
- 完成后一次性交接并接受一次集中审查。

## 6. 个人交付物

- 前两个 timestamped migration；
- 匿名化 seed；
- constraints 和默认拒绝测试；
- `database.generated.ts`；
- migration 回滚／前向修复和 schema 交接说明。

## 7. 个人验收清单

- [ ] 7 个类型和 11 个表可从空库建立；
- [ ] 每个 public 表启用 RLS；
- [ ] 约束、索引、触发器和 seed 符合 Week 1 基线；
- [ ] 只修改允许文件范围；
- [ ] reset、db lint、tests、diff 和 typecheck 通过；
- [ ] 无真实资料、密码、token 或 secret；
- [ ] 交接包可独立消费；
- [ ] 成员 PR 只关联 #39 并合并到 `sprint/2-auth-foundation`；
- [ ] Review 发现已区分 #39 schema 输出缺陷与 #40 policy／其他工作包缺陷；
- [ ] 合并后 #39 保持 `Testing`，未提前关闭；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| #39 与 #40 的冻结 Schema 合同不一致 | 无法安全集成 RLS | Xuanwei 的测试无法引用冻结对象 | 由 Xuanwei 提变更请求，Li 只修改自己所有的 migration | Li／Xuanwei | 集成检查点 |
| Schema 与 RLS 需要额外索引 | Xuanwei 集成受阻 | 已冻结索引不足以通过测试 | Xuanwei 提变更请求，由 Li 增加 | Li | 集成检查点 |

## 9. 未完成项处理

- migration 不可重放、表未启用 RLS或真实数据风险立即升级；
- policy 问题不由 Li 跨界修改第三个 migration；
- 非阻断优化进入 backlog；
- 未通过数据库个人验收时不进入集成。

## 10. 周末交接

- 已完成：schema、约束、索引、seed、测试和生成类型；
- 未完成：按实际结果记录；
- 输出合同：表／列、enum、fixture、索引和验证命令；
- 集成注意事项：第三个 migration 只能引用冻结对象，不改写前两层；
- Sprint PR 纳入证据：#39 的 migration、constraint、seed、类型、review 和回滚摘要；
- 下周建议：会议功能复用现有表和 migration 流程。
