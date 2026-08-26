# US-02 验收记录

> 验收日期：2026-08-27（Australia/Sydney）
> 验收分支：`sprint/4-decision-to-task`
> 范围：`US-02`、`CONV-01` 至 `CONV-05`，以及 `TASK-01`、`TASK-02` 的 Sprint 4 回归
> 数据：全部为确定性虚构数据

## 1. 验收结论

- **技术验收：通过。** C-01 至 C-07、T-01、T-02、T-08、应用测试、权限／RLS 数据库断言、业务 schema lint 和生产构建均通过。
- **Sprint 交付验收：阻塞。** 非作者 review、Project 状态／Acceptance Gate、Stakeholder 阶段评审和空数据库 drift 证据尚未满足。
- 本记录只证明当前集成分支的可重复技术结果，不替代人工 review、Stakeholder 决定或合并授权。

## 2. C-01 至 C-07 证据

| 场景 | 共享 harness 覆盖 | 结果 |
|---|---|---|
| C-01 | 通过公开 `TaskSourceReader` 与 `resolveTaskSource` 读取决策及所属会议上下文 | 通过 |
| C-02 | 通过转换校验和 `TaskConversionPort` 创建一条且仅一条任务，并核对全部字段与 decision source | 通过 |
| C-03 | 缺少负责人和截止日期时返回字段错误、保留来源、持久化调用为零 | 通过 |
| C-04 | 通过 `SourceNavigationReader` 的会议关联任务与任务来源投影核对双向链接 | 通过 |
| C-05 | discussion 转换保存 meeting 与 discussion，decision 保持空 | 通过 |
| C-06 | 重复负责人 payload 在持久化前被 `ASSIGNEE_INVALID_CARDINALITY` 拒绝 | 通过 |
| C-07 | 未登录上下文在 repository 之前返回 `PERMISSION_DENIED`；数据库 RLS 套件另行证明匿名拒绝 | 通过 |

共享 harness 不复制生产校验规则；它组合四个工作包公开的 reader、port、service、navigation projection 和 task service。删除任一 scenario adapter 会产生显式 `blocked`，异常会产生安全的 `failed`，不会生成假成功。

## 3. T-01、T-02、T-08 回归

| 场景 | 证据 | 结果 |
|---|---|---|
| T-01 | 通过公开 `TaskEditorPort` 执行 create → read → update → 再次 read，核对更新后数据一致 | 通过 |
| T-02 | 三种状态 `not_started`、`in_progress`、`completed` 均可保存；`overdue` 被服务端验证拒绝 | 通过 |
| T-08 | 匿名 list/create 在 repository 前拒绝；完整 RLS 套件覆盖 tasks 的 allow／deny 与列权限 | 通过 |

## 4. 自动化命令与结果

| 命令 | 结果 | 证据摘要 |
|---|---|---|
| `npm run lint` | 通过 | ESLint 无错误 |
| `npm run typecheck` | 通过 | Next.js route types 生成成功，TypeScript 无错误 |
| `npm test` | 通过 | 60 个测试文件、324 项测试 |
| `npm exec vitest -- run tests/acceptance/decision-to-task` | 通过 | 2 个测试文件、6 项测试，覆盖 C-01–C-07 与 T 回归 |
| `npm run test:acceptance` | 通过 | 21 个测试文件、148 项测试 |
| `npm run db:test` | 通过 | 7 个 SQL 文件、261 项断言；含 task source、单一负责人和 RLS |
| `npm run db:test:concurrency` | 通过 | 18 项 registration 并发断言和 9 项 RLS／状态交换断言 |
| `npx supabase db lint --local --schema public,private --fail-on error` | 通过 | 业务 schema 无错误 |
| `npm run db:lint` | 失败 | 未限定 schema，Supabase CLI 2.111.0 扫描 pgTAP `extensions` 并报告扩展内部错误；业务 schema 的窄检查通过 |
| `npm run db:diff` | 非空 | 账号管理和会议函数存在既有本地 drift；没有 Sprint 4 migration，未在本工作包越权修复 |
| `npm run build` | 通过 | Next.js 16.3.0 production build 完成，task conversion 动态路由已生成 |

## 5. 权限、隐私与数据完整性

- 任务和转换只允许有效后台身份；匿名拒绝发生在持久化之前，RLS 测试覆盖匿名直接数据库访问；
- 来源 meeting 必填，decision 与 discussion point 至多一个，数据库外键和来源形状约束由既有 migrations 与 261 项数据库断言覆盖；
- `assignee_id` 为必填标量 UUID，UI 是单选，服务端拒绝数组／重复值，数据库拒绝数组类型；
- 来源字段更新受不可变 trigger 保护，重复来源受 partial unique index 保护；
- 没有新增 schema、migration、secret key、参与者字段或真实资料；`src/types/database.generated.ts` 无需重新生成；
- 测试使用 `example.test` 风格或固定虚构 UUID，不记录环境值、会话、真实姓名或参与者数据。

## 6. UI 状态复核

现有功能测试和完整应用测试覆盖转换页面的可信来源上下文、字段校验、单选负责人、pending、duplicate、permission、system error、missing source、success，以及会议／任务导航的 loading、empty、unavailable、system error 和 success。生产 build 证明相关 App Router 路由可编译。

窄屏、完整键盘顺序和真实浏览器错误摘要焦点属于条件允许项，本次没有生成可核对的浏览器录屏或截图，因此不把该项列为已完成的人工证据。

## 7. Migration、回滚与部署影响

Sprint 4 复用 Week 2 已存在的 `tasks` schema、约束、索引、RLS 和生成类型，没有新增 migration。应用层回退可通过回退 Sprint 4 功能提交完成；已创建的任务使用既有 schema，可保留为向后兼容数据。

`db:diff` 的非空输出涉及既有账号管理与会议函数，不属于 #3、#15、#23、#24、#25 的新增 schema。该 drift 在 Sprint 总 PR 前必须由正确所有者核对；不得通过重写历史 migration 或 Joshua 越界修改功能来隐藏。

## 8. 交付阻塞与判定

详细 GitHub 证据见 [Sprint 4 集成记录](SPRINT_4_INTEGRATION_RECORD.md)。当前阻塞项：

1. #15 没有可检索到的成员 PR；
2. #66、#67、#68 的 reviews 为空，不能证明非作者批准；
3. #3、#15、#23、#24、#25 虽属于 Sprint 4，但 Project 状态均为 `Backlog`，Acceptance Gate 为 `Not checked` 或 `Incomplete`；
4. [Stakeholder 阶段评审](SPRINT_4_STAKEHOLDER_STAGE_REVIEW.md)尚未由真实参与者执行和确认；
5. `npm run db:diff` 不是空结果。

因此当前结论是：**代码可演示，技术验收通过，Sprint 4 尚不能声明 Done。**
