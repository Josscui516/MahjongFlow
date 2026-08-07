# 课程第 3 周（开发第 2 周）：认证、权限与数据基础

> 本计划依据[《MVP 项目企划书》](../../project/MVP_PROJECT_PROPOSAL.md)编制。本周采用 5 个低耦合独立工作包，只建立认证、角色、数据库、权限、共享界面和验收基础，不实现后续业务模块。

## 1. 本周目标

完成里程碑 M1：账号可登录、保持会话并登出；后台路由受保护；核心 schema、约束、RLS 和匿名化 seed 可重放；`committee` 与 `authorised` 权限在服务端和数据库生效；共享布局与反馈组件可复用；X-01 至 X-07 通过验收。

### 成员独立工作文档

- [Joshua：认证与会话](JOSHUA_WEEKLY_WORK_PLAN.md)
- [Li：数据库结构与约束](LI_WEEKLY_WORK_PLAN.md)
- [Xuanwei：RLS 与服务端授权](XUANWEI_WEEKLY_WORK_PLAN.md)
- [Shiying：共享布局与反馈组件](SHIYING_WEEKLY_WORK_PLAN.md)
- [Yubo：测试基础与 M1 验收工具](YUBO_WEEKLY_WORK_PLAN.md)

### GitHub Project 分配

| 成员 | GitHub 账号 | 主要 Issue | Project 角色 |
|---|---|---|---|
| Joshua | `Josscui516` | #9 | WP-A 认证与会话 |
| Li | `Kaia-Zhang` | #39 | WP-B Schema 与约束 |
| Xuanwei | `YUHAN2233` | #40 | WP-C RLS 与服务端授权 |
| Shiying | `Scarletthekiller` | #11 | WP-D 共享 UI |
| Yubo | `Caiqwe123` | #41 | WP-E 测试与验收基础 |

Issue #10 由 `Josscui516` 担任上层协调负责人，原生 sub-issues 为 #39 和 #40；它不构成第六个个人工作包，也不得与 #9 同时作为 Joshua 的主要 `In Progress` Issue。

## 2. 上周输入与开始条件

- Week 1 的范围、验收矩阵、ERD、权限矩阵、隐私清单和 migration 方案已评审；
- Next.js、Supabase、Vercel、本地数据库和空 migration 基线可用；
- 周初一次性冻结第 5 节的接口和文件所有权；
- Issue #9、#10、#11、#39、#40、#41 已存在；五个成员工作包分别使用 #9、#39、#40、#11、#41，不再共用无法独立交付的 Issue；
- GitHub Project 的 `Current Sprint` 视图已将 #9、#10、#39、#40、#11、#41 标记为 `Sprint 2`；Day 5 步骤 9 补充验证后六项均为 `Ready`，其中 #39 的固定 Auth UUID fixture 方法已验证，#10 只承担协调与最终验收整合；
- 只使用虚构数据；默认只在本地数据库验证，远程写操作仍需用户明确授权。

## 3. 本周范围

### 3.1 必须完成

- Issue #9：登录、登出、会话和受保护路由，覆盖 X-01–03；
- Issue #10：作为 AUTH-03–04 上层协调 Enabler；
- Issue #39：核心 schema、约束、seed 和生成类型，为 X-04–06 提供数据基础；
- Issue #40：角色、RLS 和服务端授权，覆盖 X-04–06；
- Issue #11：共享布局、导航、表单和反馈状态，覆盖 X-07；
- Issue #41：测试配置、统一质量入口、X-01–07 验收 harness 和 M1 汇总；
- 5 个工作包独立自测后完成一次集成和一次集中审查。

### 3.2 条件允许时完成

- 小屏、键盘和基础可访问性自动检查；
- 更完整的本地 fixture 与测试报告。

### 3.3 明确不做

- 不实现会议、任务、Dashboard、活动、报名、签到和晚餐核验业务页面；
- 不实现注册、找回密码、OAuth、MFA 或角色编辑器；
- 不使用 service secret 绕过普通请求；
- 不跨工作包顺手修改他人文件；
- 未经授权不执行 Git 写操作或远程数据库／部署变更。

## 4. 五个独立工作包

| 成员 | 独立工作包 | 主要文件所有权 | 固定输入合同 | 输出合同 | 个人验证 |
|---|---|---|---|---|---|
| Joshua | WP-A 认证与会话（#9） | `src/app/(auth)/`、认证 session 模块、认证路由守卫文件（不含受保护 layout）、`tests/auth/` | Supabase public env；`AuthenticatedUser { id }` | `getAuthenticatedUser()`、登录／登出动作、未认证拒绝 | X-01–03、认证测试、typecheck、build |
| Li | WP-B Schema 与约束（#39） | 前两个新 migration、`supabase/seed.sql`、`supabase/tests/constraints/`、生成数据库类型 | Week 1 ERD；固定 Auth UUID fixture | 11 个表、约束、索引、seed、类型 | reset、db lint、constraints、diff |
| Xuanwei | WP-C RLS 与授权（#40） | 第三个新 migration、`src/lib/auth/authorization.ts`、`supabase/tests/rls/` | 固定表／列名；`AuthenticatedUser { id }`；`AccessContext` 合同 | role helpers、policies、`requireBackendUser()`、`requireAuthorised()` | X-04–06、RLS 正反向与反提权 |
| Shiying | WP-D 共享 UI（#11） | `src/components/layout/`、`src/components/forms/`、`src/components/feedback/`、受保护布局、组件测试 | `AccessContext { userId, role }`；固定认证错误码 | 布局、导航、表单、五类反馈组件 | X-07、组件测试、键盘与窄屏检查 |
| Yubo | WP-E 测试与验收基础（#41） | 测试配置、`tests/acceptance/`、CI／质量脚本、M1 验收记录 | X-01–07 行为合同；各工作包公开输出 | 统一测试入口、验收矩阵、脱敏证据 | 测试框架自检、质量流水线、M1 汇总 |

每名成员只编辑自己的范围。共享配置若确需变更，由 Yubo 统一处理；数据库 migration 按文件所有权区分，Li 不修改第三个 migration，Xuanwei 不修改前两个 migration。

## 5. 固定接口与文件边界

| 合同／边界 | 提供者 | 使用者 | 周初冻结内容 | 允许变更条件 |
|---|---|---|---|---|
| `AuthenticatedUser` | Joshua | Xuanwei | 只包含可信 `id`，未认证返回统一失败 | 当前 Supabase API 无法实现或安全测试失败 |
| `AccessContext` | Xuanwei | Shiying | `userId`、`role: committee \| authorised` | 权限矩阵无法表达或类型检查失败 |
| Schema 清单 | Li | Xuanwei、Yubo | Week 1 的表名、列名、角色 enum 和关键索引 | migration 无法重放或与已批准 ERD 冲突 |
| UI 状态合同 | Shiying | Joshua、Yubo | loading、empty、success、error、permission denied | X-07 无法验收或可访问性阻断 |
| 测试命令合同 | Yubo | 全体 | lint、typecheck、应用测试、数据库测试、build 入口 | 当前工具无法运行或 CI 阻断 |

接口冻结后，各成员可用本地 stub、mock 或 fixture 独立工作。提出者不得直接改提供者文件；只记录变更请求，由文件所有者决定并实施。

## 6. 三个团队检查点

### 检查点 1：周初合同冻结

- 一次性确认工作包、真实 Issue、文件所有权和第 5 节接口；
- 确认每个人能独立开始；
- 完成后不安排日常全员同步。

### 检查点 2：单次集成

进入条件：5 个工作包分别完成个人验收。

集成顺序：Li schema → Xuanwei RLS → Joshua 会话／守卫 → Shiying UI → Yubo 验收入口。只修复接口不一致和阻断缺陷，不在集成阶段重构他人工作。

### 检查点 3：周末验收

- 集中执行一次非作者审查；
- 运行 reset、lint、typecheck、全部测试和 build；
- 执行 X-01–07 并形成 M1 结论；
- 非阻断建议统一进入 backlog。

## 7. 本周交付物

- Joshua 的认证、会话与路由保护包；
- Li 的 schema、约束、seed 和生成类型包；
- Xuanwei 的 RLS、角色 helper 与授权守卫包；
- Shiying 的共享布局、表单和反馈组件包；
- Yubo 的统一测试、CI／质量入口和 M1 验收记录；
- 固定接口、变更请求、集成结果和遗留风险记录。

## 8. 本周验收清单

- [ ] 5 个工作包分别完成个人验收；
- [ ] 没有成员跨越文件所有权覆盖他人改动；
- [ ] 登录、会话保持、登出和匿名拒绝通过；
- [ ] 11 个核心表、约束、seed 和类型可重放；
- [ ] committee、authorised、anon 与无 profile 权限符合矩阵；
- [ ] 共享布局和五类反馈状态通过；
- [ ] 固定接口在单次集成中兼容；
- [ ] 每个工作包完成一次集中非作者审查；
- [ ] lint、typecheck、应用测试、数据库测试和 build 通过；
- [ ] 仓库与证据不含秘密或真实资料；
- [ ] 阻断缺陷为零，下周输入达到 Ready。

## 9. 风险与应对

| 风险 | 信号 | 影响 | 应对 | 所有者 |
|---|---|---|---|---|
| 冻结接口设计不足 | 两个以上工作包无法独立推进 | 集成返工 | 仅召开一次接口变更沟通，由原所有者修改 | 对应接口提供者 |
| 跨文件所有权修改 | 同一文件出现并行冲突 | 覆盖工作 | 停止修改，回到所有者处理变更请求 | 发生冲突的文件所有者 |
| #39 与 #40 的冻结合同不一致 | Schema 或 RLS 集成返工 | 阻断实施 | 只通过接口变更请求由原所有者修改；#10 记录协调结论 | Li／Xuanwei |
| 集成拖到周末 | 个人包均完成但接口未接通 | M1 延迟 | 工作包自测完成后立即安排唯一集成检查点 | Yubo |
| RLS 或秘密泄露 | committee 读取敏感数据或证据含凭据 | 高风险 | 立即停止集成并修复，不受低频沟通限制 | Xuanwei／Yubo |

## 10. 本周完成定义

1. 5 个独立工作包均有可使用的交付物和个人验证证据；
2. X-01 至 X-07 通过；
3. 三个 migration、seed、RLS、生成类型和测试可重放；
4. 单次集成与集中非作者审查完成；
5. lint、typecheck、测试和 build 全部通过；
6. 权限、隐私和密钥检查通过；
7. 阻断问题为零，非阻断遗留项有负责人和期限；
8. 课程第 4 周会议模块输入达到 Ready。

## 11. 未完成项处理

- 个人工作包阻断时，先记录问题并继续不依赖部分；只有无法交付时才触发临时沟通；
- 接口变化由提供者处理，不允许使用者直接修改提供者文件；
- 集成发现的阻断问题只在唯一集成检查点集中修复；
- 安全、权限、数据丢失或秘密泄露风险立即升级；
- 非阻断事项进入 backlog，不增加同步频率；
- 新需求不得替代未完成的 P0 基础。
