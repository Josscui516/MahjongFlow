# Sprint 5 任务跟进验收记录

## 1. 结论与范围

2026-09-15（Australia/Sydney）：**Sprint 5 技术阶段验收通过，交付终点为 Sprint 5 → main 总 PR；本次不合并 main，不关闭 Issues。**

依据[企划书](../../project/MVP_PROJECT_PROPOSAL.md)、[统一周计划](WEEK_5_IMPLEMENTATION_PLAN.md)及五份成员工作文档。用户本次明确授权 Joshua 统一完成剩余实现、验收和集成，免除其他成员审查／操作；该例外只适用于本次 Sprint 5，不改变长期团队规则。

- 集成基线：`sprint/5-dashboard-follow-up`，`4f029995b0c7a61f8124b2ebaffea0cffdb35164`。
- main 基线：`97060b75034d3052ed67898b16bf186637c8fe9e`。
- 后续修复和证据：`codex/4-task-follow-up-acceptance`；准确候选 SHA 以包含本记录的提交及 PR checks 为准。
- 本机真实 Auth、PostgREST、数据库及 RLS 验证，Chrome 使用本地 production build。不是生产部署验收。
- 原有 `supabase/config.toml` 的本机端口改动保留，不纳入交付。

## 2. 分支与 PR 覆盖

审计远程全部 14 个分支：11 个功能分支都有对应 PR，未发现遗漏的无 PR Sprint 5 功能分支。#71、#76 原已合入 Sprint 5；本次先将 #72、#78 合入，然后在集成基线上修复并执行完整检查。#72 的原分支失败不能作为集成结果；以本记录及最终候选检查为准。

| 工作包 | 已纳入的 PR | 结果 |
|---|---|---|
| #16 Sydney 日期 | [#71](https://github.com/Josscui516/MahjongFlow/pull/71) | 已集成，日期边界回归通过 |
| #20 筛选 | [#76](https://github.com/Josscui516/MahjongFlow/pull/76) | 已集成，真实关系筛选和 URL 走查通过 |
| #22 提醒 | [#72](https://github.com/Josscui516/MahjongFlow/pull/72) | 已集成，补齐两个宿主挂载 |
| #21 Dashboard | [#78](https://github.com/Josscui516/MahjongFlow/pull/78) | 已集成，补齐后台导航与刷新 |
| #4 整体验收 | 本记录所在验收分支 | 共享真实数据库测试、Chrome 走查及修复 |

Sprint 6 [#81](https://github.com/Josscui516/MahjongFlow/pull/81) 属于下一 Sprint；只参考其中与 Sprint 5 有关的缺陷，未合入活动／报名实现。原有功能作者归属保留，集成修复由 Joshua 按本次例外承担。

## 3. 缺陷与复验

| 原缺陷 | 责任与影响 | 修复及复验 |
|---|---|---|
| 任务列表／Dashboard 未挂载提醒 | #20/#21 宿主集成，阻断 T-07 | 复用 #16 classifier、#22 文字加图标组件；真实 adapter SSR 与桌面／窄屏 Chrome 通过 |
| Dashboard 缺后台 shell | #21，导航和移动端闭环受阻 | 新增带认证的 layout，去除嵌套 main，桌面和移动菜单通过 |
| 更新任务发送不可变来源列 | 既有任务写入缺陷，阻断 T-04 | 只更新可变字段；真实数据库完成任务成功，会议来源保留 |
| 写入后已有 Dashboard 缓存未刷新 | 跨包集成，阻断统计一致性 | 创建／更新／删除及两个转换入口成功后刷新；动作回归和 Chrome 往返通过 |
| 转换成功无任务入口，表单重置选择不一致 | 既有转换衔接，影响端到端走查 | 成功链接与选择值保留；创建→详情→完成→来源会议，重复来源拒绝均通过 |
| 表单异常可能一直 pending | 任务编辑器失败路径 | try/catch/finally、安全消息及重复提交保护 |
| 无效日期风险被静默丢弃 | #21 adapter，错误可能伪装成零 | 返回区块 SYSTEM_ERROR，专门回归测试通过 |

本次发现的 Sprint 5 阻断缺陷剩余 **0**。不将其他成员审查豁免写成已获得团队批准。

## 4. 验收矩阵

| 场景 | 结果与证据 |
|---|---|
| T-03 | 共享日期单测：昨天／今天／第 7、8 日、Sydney 午夜／DST、闰日和无效输入；任务和 Dashboard 同 classifier |
| T-04 | 真实任务完成后从未完成、临期／逾期移除；Chrome 返回已访问 Dashboard 数字更新；来源关联保留 |
| T-05-S5 | 真实数据库负责人、状态、日期和 eventId 四类及 AND；跨页／准确 total；Chrome 清除、重载、非法值和空结果 |
| T-06-S5 | 四类真实任务查询与统计、错误区块；Chrome committee 数据和 authorised 本人空状态；活动明确未接入 |
| T-07 | 两处文字和图标提醒，375／320px 无横向溢出，键盘焦点可见；源码未引入邮件、短信或推送接口／配置 |
| T-08 | Chrome 匿名登录重定向及无后台 profile 的已登录用户拒绝；真实服务／RLS 拒绝读取和更新；两个后台角色允许 |
| C-01–C-07、T-01/02 | 全量回归、SQL 约束／权限通过；Chrome 决策转任务、必填校验、重复来源拒绝和双向来源链接通过 |

完整 T-05／T-06 的真实活动创建关联与近期活动接入仍由 Sprint 6 #18/#19 验收；本记录不宣称其完成。

## 5. 实际检查（2026-09-15 18:30 AEST）

| 命令 | 结果 |
|---|---|
| `npm run lint` | 通过 |
| `npm run typecheck` | 通过 |
| `npm test` | 418 通过；3 个真实数据库测试默认跳过，单独执行如下；另 5 个脚本测试通过 |
| `npm run test:acceptance` | 148 通过，3 个上述条件测试跳过 |
| `npm run test:sprint5` | 3 个真实 Auth／PostgREST／RLS／adapter 集成测试全部通过 |
| `npm run db:test` | 8 个 SQL 文件、274 个断言通过 |
| `node tests/fixtures/task-follow-up/local-runtime.cjs build` | 默认 Turbopack production build 与 TypeScript 通过；等价调用 next build，环境指向本机 fixture |
| Chrome | 见[内部走查](INTERNAL_USABILITY_WALKTHROUGH.md)与 5 张截图 |

## 6. 本机复现

运行环境需要本机 Docker Supabase（API `127.0.0.1:45321`，容器 `supabase_db_MahjongFlow`），按运维文档准备 migrations。此专用 harness 检查 loopback 和端口，避免触及远程环境；默认仓库端口不同的机器需先准备独立本机配置。不要重置含有他人工作的数据库。

```powershell
node tests/fixtures/task-follow-up/local-runtime.cjs provision
npm run test:sprint5
node tests/fixtures/task-follow-up/local-runtime.cjs build
node tests/fixtures/task-follow-up/local-runtime.cjs serve
```

`provision` 仅供本机验收，新增虚构账号、会议／决策、活动关系及五条任务，不清空数据。重复运行会新增 fixture；普通复验直接运行 test。随机凭据只写入系统临时目录 `mahjongflow-s5-acceptance/accounts.json`，不可提交、打印或附到 PR。任务日期按 Sydney 当天创建；跨日复验应重新 provision。Chrome 打开本机端口 3005，使用该临时文件中的虚构账号。真实测试只对这些 fixture 更新状态；普通测试套件不要求服务在线。

## 7. 数据库、权限与回退

本 Sprint 相对 main 未新增 migration、RLS policy 或生成类型修改；沿用既有约束和列权限，修正应用写入字段。无 schema 部署顺序或不可逆迁移。未重置共享本机库；SQL 回归在事务中回滚。回退应用提交即可恢复代码基线，业务任务数据保留。生产部署、生产数据及生产凭据未操作。

Project 成员必须恰为 #4/#16/#20/#21/#22。技术验收后手动更新为 Testing／Acceptance Gate Passed；main 未合并前保持 Issues open，不能标记 Done。总 PR 仍列出准确成员集合并保留最终 checks 结果。
