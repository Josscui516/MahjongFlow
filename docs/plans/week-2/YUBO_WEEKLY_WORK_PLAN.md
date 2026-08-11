# Yubo：课程第 3 周（开发第 2 周）独立工作计划

所属统一周计划：[认证、权限与数据基础](WEEK_2_IMPLEMENTATION_PLAN.md)

直接依赖文档：[Joshua](JOSHUA_WEEKLY_WORK_PLAN.md)、[Li](LI_WEEKLY_WORK_PLAN.md)、[Xuanwei](XUANWEI_WEEKLY_WORK_PLAN.md)、[Shiying](SHIYING_WEEKLY_WORK_PLAN.md)仅在单次集成后提供公开输出；独立阶段依据 X-01–07 合同建立测试 harness。

## 1. 独立目标

独立完成 Issue #41，建立应用测试配置、统一质量命令、验收测试骨架、CI 基础和 M1 证据模板。Yubo 不持续参与其他四人的实现，也不修改其业务文件；只在单次集成后运行公开输出。

## 2. 工作包与文件所有权

- 成员姓名：Yubo；
- GitHub Assignee：`Caiqwe123`；
- 独立工作包：WP-E 测试与验收基础；
- 主要 Issue：#41；父 Epic 为 #1；
- GitHub Sprint：`Sprint 2`；
- Sprint 集成分支：`sprint/2-auth-foundation`；
- Issue 分支：`test/41-m1-acceptance-harness`；
- 成员 PR base：`sprint/2-auth-foundation`；
- Sprint 总 PR：以 #41 为唯一主要 Issue，从 `sprint/2-auth-foundation` 进入 `main`，纳入 #9、#10、#11、#39、#40；
- 允许修改：测试配置、`tests/acceptance/`、CI／质量脚本、Week 2 M1 验收记录；
- 禁止修改：认证实现、前两个 migration、第三个 RLS migration、授权模块和共享 UI 组件；
- 固定输入合同：X-01–07 的输入／预期、五个公开测试命令类别和虚构 fixture 标识；
- 输出合同：统一 test／quality 入口、验收矩阵、脱敏证据格式和 M1 汇总命令；
- 集中非作者审查人：Shiying，只在完成后审查测试入口和证据格式一次。

## 3. 开始条件

- X-01–07 已冻结为行为合同；
- 当前 lint、typecheck、build 和数据库命令可调用；
- 测试框架选择与 Week 1 技术基线一致；
- 测试只使用虚构数据，证据不得显示密码、session、token 或 secret；
- 真实 Issue 和 Git 前提在任何 Git 写操作前确认。

## 4. 独立执行步骤

### 步骤 1：建立测试与质量基线

执行：

1. 配置应用测试入口和目录约定；
2. 建立 lint、typecheck、test、database test 和 build 的统一命令清单；
3. 建立不会依赖远程生产数据的测试环境；
4. 建立失败返回非零的 smoke test。

产出：测试配置、质量入口和 smoke test。

检查：成功和故意失败均可被命令行／CI 正确识别。

### 步骤 2：建立 X-01–07 验收 harness

执行：

1. 为认证、角色、数据库和 UI 定义 adapter 接口；
2. 用 stub／mock 建立 X-01–07 测试骨架；
3. 建立 committee、authorised、anon、无 profile fixture 引用；
4. 建立脱敏证据模板和安全扫描清单。

产出：`tests/acceptance/` 骨架和 M1 证据模板。

检查：在真实工作包未接入前，harness 自身可运行且失败原因清晰。

### 步骤 3：个人验证测试基础

执行：

1. 运行测试框架 smoke、lint、typecheck 和 build；
2. 验证缺少 adapter 时给出明确失败而非假通过；
3. 验证证据模板不会保存秘密字段；
4. 检查 CI／质量配置不需要生产密钥。

产出：测试基础个人验证证据。

检查：harness、质量命令和证据安全全部通过。

### 步骤 4：一次性集成与汇总

执行：

1. 在唯一集成检查点接入其余四个工作包的公开输出；
2. 不修改其实现文件，adapter 不兼容时提交变更请求；
3. 运行完整 reset、lint、typecheck、tests、diff、类型生成和 build；
4. 汇总 X-01–07 与集中非作者审查结果，形成 M1 结论；
5. 确认纳入 Issues 全部为 `Testing` 且 Acceptance Gate 为 `Passed` 后创建 Sprint 总 PR；
6. 对 review 缺陷做归属：当前 adapter／harness 缺陷由 #41 修复，其他工作包输出不符合冻结合同时退回对应 Issue，不越界修改。

产出：完整质量结果和 M1 验收记录。

检查：每个通过项有脱敏证据；阻断失败时 M1 保持未通过。

## 5. 低频沟通规则

- 周初只确认测试命令和 adapter 合同；
- 独立阶段不参加其他工作包日常实现；
- 只有测试工具本身阻断全体、接口无法适配或发现秘密／安全问题时沟通；
- 不直接修复其他成员业务文件；
- 单次集成后集中收集结果，周末由 Shiying 审查一次测试入口和证据。

## 6. 个人交付物

- 应用测试配置和 smoke test；
- 统一质量命令与 CI 基础；
- `tests/acceptance/` 骨架；
- X-01–07 矩阵和脱敏证据模板；
- M1 汇总结果与风险清单。

## 7. 个人验收清单

- [ ] 测试框架成功／失败识别正确；
- [ ] X-01–07 均有 adapter 和预期结果；
- [ ] 只修改允许文件范围；
- [ ] CI／质量配置不依赖生产秘密；
- [ ] lint、typecheck、smoke test 和 build 通过；
- [ ] 证据模板通过敏感信息检查；
- [ ] 单次集成入口清晰；
- [ ] #41 成员 PR 已先合并到 Sprint 分支并保持 `Testing`；
- [ ] Sprint 总 PR 以 #41 为主要 Issue，并列出 #9、#10、#11、#39、#40；
- [ ] Review 缺陷归属、整组 checks、threads 和验收门禁均有证据；
- [ ] 未完成项有负责人、期限和下次检查时间。

## 8. 风险与问题

| 风险／问题 | 影响 | 触发沟通条件 | 处理方式 | 负责人 | 期限 |
|---|---|---|---|---|---|
| Adapter 与真实输出不兼容 | 单次集成失败 | 无法通过公开合同接入 | 提交变更请求或只改 Yubo adapter | Yubo | 集成检查点 |
| 证据包含敏感值 | 安全事故 | 扫描发现密码／token／真实资料 | 立即停止传播并处理暴露 | Yubo | 立即 |

## 9. 未完成项处理

- 测试假通过、生产秘密依赖或证据泄露立即升级；
- 其他工作包失败只记录并退回所有者，不越界修复；
- 非阻断测试增强进入 backlog；
- 完整质量检查未通过时 M1 保持未完成。

## 10. 周末交接

- 已完成：测试配置、质量入口、验收 harness 和 M1 汇总；
- 未完成：按实际结果记录；
- 输出合同：统一命令、adapter、验收矩阵和证据格式；
- 集成注意事项：只消费公开输出，不依赖私有实现细节；
- Sprint PR 纳入证据：整组 Issues 的 Sprint、Testing、Acceptance Gate、reviews、checks、migration 顺序和回滚摘要；
- 下周建议：会议模块按相同 adapter 扩展验收，不增加日常同步。
