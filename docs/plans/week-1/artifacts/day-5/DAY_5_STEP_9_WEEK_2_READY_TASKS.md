# 第 5 天步骤 9：开发第 2 周首批 Ready 任务记录

> 所属计划：[第 5 天：工程质量基线、周验收与下周准备](../../DAY_5_QUALITY_AND_WEEKLY_ACCEPTANCE.md)
> 下周计划：[课程第 3 周（开发第 2 周）实现计划](../../../../plans/week-2/WEEK_2_IMPLEMENTATION_PLAN.md)
> Project：[MahjongFlow MVP GitHub Project](https://github.com/users/Josscui516/projects/5)
> 执行日期：2026-08-07（Australia/Sydney）
> 结论：步骤 9 完成；补充验证后 Sprint 2 六项均进入 `Ready`

## 1. 执行结论

已逐项读取 Sprint 2 的 #9、#10、#11、#39、#40、#41，以及统一 Week 2 计划和
五份成员工作计划。所有六项均属于已批准 P0 Foundation & Auth 范围，并具有验收
条件、验证方式、Sprint、目标周和依赖说明。

经过 refinement：

- #9、#11、#39、#40、#41 具备独立实现输入、明确负责人、工作量、文件所有权和个人验证，已移动到 `Ready`；
- #39 已在 Supabase CLI `2.111.0` 的本地环境验证固定虚构 Auth UUID fixture 可在 reset 后以相同 UUID 重建；
- #10 已由 `Josscui516` 担任协调负责人并进入 `Ready`，但它不是第六个个人工作包，不得与 #9 同时作为 Joshua 的主要 `In Progress` Issue；
- 当前没有任何主要 Issue 处于 `In Progress`，未触发 WIP 超限。

## 2. Refinement 结果

| Issue | P0／验收 | 负责人 | Effort | 独立输入与依赖 | 文件所有权／个人验证 | 最终状态 |
|---|---|---|---:|---|---|---|
| [#9](https://github.com/Josscui516/MahjongFlow/issues/9) WP-A 认证与会话 | AUTH-01–02；X-01–03 | `Josscui516` | 5 | 无前置阻塞；使用公开 Supabase 环境合同 | 认证路由、session、守卫与 `tests/auth/`；认证、匿名拒绝、typecheck、build | `Ready` |
| [#11](https://github.com/Josscui516/MahjongFlow/issues/11) WP-D 共享 UI | AUTH-05；X-07 | `Scarletthekiller` | 3 | 冻结错误合同、`AccessContext` 和角色 mock 可独立开发；#9、#40 只在集成时需要 | layout、forms、feedback 与组件测试；五类状态、键盘、窄屏、quality | `Ready` |
| [#40](https://github.com/Josscui516/MahjongFlow/issues/40) WP-C RLS 与服务端授权 | AUTH-03–04；X-04–06 | `YUHAN2233` | 8 | 冻结 schema、`AuthenticatedUser`、`AccessContext` 可离线实施；#9、#39 是集成依赖 | 第三个 migration、授权模块与 RLS tests；四种上下文及反提权 | `Ready` |
| [#41](https://github.com/Josscui516/MahjongFlow/issues/41) WP-E 测试与验收 | AUTH-01–05、PRIV-03；X-01–07 | `Caiqwe123` | 5 | 冻结 adapter 和行为合同可独立建立 harness；其余工作包只在单次集成时需要 | 测试配置、acceptance、CI／质量脚本和 M1 记录；smoke、quality、脱敏证据 | `Ready` |
| [#39](https://github.com/Josscui516/MahjongFlow/issues/39) WP-B Schema 与约束 | AUTH-03–04；支撑 X-04–06 | `Kaia-Zhang` | 8 | ERD、UUID 标识及本地固定 Auth fixture 方法已验证 | 前两个 migration、seed、constraints 和生成类型；reset、lint、diff、typecheck | `Ready` |
| [#10](https://github.com/Josscui516/MahjongFlow/issues/10) 协调 Enabler | AUTH-03–04；X-04–06 | `Josscui516` | 8 | #9、#39、#40 可独立启动；X-04–06 验收前完成一次集成协调 | 只协调子任务与最终验收，不独立占用文件范围 | `Ready` |

## 3. 本次补充与修正

- #11 的 Issue 依赖已从“被 #9 阻塞”修正为：冻结 mock 合同允许独立开发，#9 和 #40 仅为集成依赖；
- #39 的 Issue 和 Project 已补充固定 Auth fixture 的验证结论并移除前置阻断；
- #39、#40、#41 的相对工作量分别补为 8、8、5；
- #9、#10、#11、#39、#40、#41 的 Project `Status` 均为 `Ready`；
- 所有 Issue 的 `Acceptance Gate` 继续保持 `Incomplete`，没有把“可开始”误写为“已完成”。

## 4. #39 门禁关闭记录

| 字段 | 记录 |
|---|---|
| 原因 | 需要证明在 Supabase CLI `2.111.0` 下可重复创建固定 UUID 的本地虚构 Auth 用户 |
| 验证 | 在本地事务中向 `auth.users` 和对应 email `auth.identities` 写入固定虚构 UUID；token 字符串使用非 NULL 空字符串，省略生成列 `confirmed_at`，密码仅在忽略的本地运行时配置中生成 |
| 结果 | 首次创建后可登录；执行 `db reset --no-seed` 后记录被清除，并可再次以同一 UUID 创建；测试记录已清理，仓库未写入密码、token 或真实资料 |
| 使用约束 | 该方法只用于本地 fixture；不得直接对远程 Supabase Auth schema 写入，不得把测试凭据提交到仓库 |
| 负责人 | Li Zhang／`Kaia-Zhang` |
| 关闭时间 | 2026-08-07（Australia/Sydney） |
| 后续检查 | #39 实施时将方法固化到可重放的本地 fixture，并由 constraints／RLS 测试消费 |

该门禁已在 #39 和 `D5-OI-05` 中关闭，不新增重复 Issue。#40 仍可使用冻结 schema
和 mock JWT 独立实施，并在唯一集成检查点消费 #39 的真实输出。

## 5. Ready 启动规则

`Ready` 只表示 refinement 完成，不表示已开始实现。每名负责人开始时仍必须：

1. 确认自己没有另一个主要 Issue 处于 `In Progress`；
2. 从最新 `main` 创建包含真实 Issue 编号的短生命周期分支；
3. 只修改个人工作计划列出的文件范围；
4. 使用冻结 mock、stub 或 fixture 独立推进；
5. 完成个人验证后再进入唯一集成检查点和集中非作者审查；
6. 不得因 `Ready` 跳过数据库、RLS、隐私、UI 状态或失败路径测试。

## 6. 步骤 9 完成检查

- [x] 六个 Sprint 2 Issue 均已核对 P0 范围和验收条件；
- [x] 五个个人工作包均有负责人、文件所有权、输出合同和个人验证；
- [x] 缺失的 Effort 与依赖说明已补齐；
- [x] #9、#11、#39、#40、#41 已进入 `Ready`；
- [x] #10 已明确协调负责人并进入 `Ready`；
- [x] `Acceptance Gate` 全部保持真实的 `Incomplete`；
- [x] 当前 `In Progress` 为 0，没有 WIP 超限。

步骤 9 已完成。五个个人工作包可在各自负责人完成分支前置检查后直接开始；#10
只在集成与验收边界承担协调作用。下一步是步骤 10 的周末评审与交接。
