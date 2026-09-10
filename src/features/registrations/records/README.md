# #27 报名登记、取消和恢复

## 范围与开发条件

本工作包对应 Sprint 6、REG-04/06、R-03/R-08，负责人 Yubo Cai（Caiqwe123）。集成负责人 Joshua；成员分支 `codex/27-registration-management`，PR base 为 `sprint/6-events-registration`。实现基线是 `97060b75034d3052ed67898b16bf186637c8fe9e`。2026-09-08 实时确认：Sprint 6 分支与 #27/#28 分配已存在，Project 仍为 Backlog；不能据此断言 Sprint 尚未启动或功能已验收。

统一 Week 6 计划目前只在 Sprint 5 的计划提交 `251d15054ff02cd461c85c9687cd4086de6e25ce` 中。参考[统一计划](https://github.com/Josscui516/MahjongFlow/blob/251d15054ff02cd461c85c9687cd4086de6e25ce/docs/plans/week-6/WEEK_6_IMPLEMENTATION_PLAN.md)与[Yubo 计划](https://github.com/Josscui516/MahjongFlow/blob/251d15054ff02cd461c85c9687cd4086de6e25ce/docs/plans/week-6/YUBO_WEEKLY_WORK_PLAN.md)。其中“尚未创建 Sprint 6”的历史说明已经落后于实时分支和分配；前周集成验收与真实 provider 交付仍不能假定完成。

## 已实现

- `service.ts`：每次敏感操作先检查当前 active authorised 角色；计数允许 committee/authorised，未知角色拒绝。输入无效、无权限、不可用、冲突和系统错误分别返回安全结果。
- `repository.ts`：使用当前用户 Supabase client 和既有 RLS；名单按 eventId 隔离，稳定排序，每页 25 条，返回全量匹配 total。列表 DTO 只含必要姓名、邮箱、状态、记录 ID 和并发版本；不发送学号、参与者 ID、操作者、隐私确认或完整数据库行。
- 首次登记只 INSERT 已解析的 eventId/participantId，数据库默认 Registered 并生成时间/操作者。唯一冲突读取原记录并返回 duplicate，不重复插入、不更新、更不恢复已有 Cancelled 记录。
- 取消/恢复只写 `registration_status`，并使用 eventId、registrationId 和 `updated_at` 比较更新。重复达到目标状态为 unchanged；旧页面不能覆盖新的相反状态。
- 安全人数调用既有 `get_event_participation_totals`，只返回 `{eventId, registrationCount}`。不存在/查询失败不伪装成零；取消退出计数、恢复重新计数。名单 total 包含取消记录，与当前报名人数分别标注。
- `RegistrationCreateForm` 消费已解析参与者，不复制 Shiying 的身份输入或校验。`RegistrationStatusForm` 防止 pending 时重复提交，处理安全错误、冲突、成功和网络失败；成功刷新报名/活动路径，刷新失败明确提示但不谎报持久化失败。
- `/registrations/[eventId]` 提供授权名单、分页、取消/恢复、当前人数及 loading/error 状态。匿名重定向保留有效活动目标，committee/参与者无名单响应。

## 输入与接入

公开 UI 入口为 `@/features/registrations/records`；Server Actions 单独从 `records/actions` 导入，避免客户端引入服务端模块。

```tsx
import { RegistrationCreateForm } from "@/features/registrations/records";
import { registerParticipant } from "@/features/registrations/records/actions";

// event 来自 Li 的可信活动 read port；participant 来自 Shiying 的授权身份 port。
// 这是消费者所需最小映射，不是替两位提供者命名/冻结他们的 DTO。
<RegistrationCreateForm
  eventId={event.id}
  participant={{ id: participant.id, label: participant.displayLabel }}
  register={registerParticipant}
/>
```

新建报名 Server Action 再检查角色和输入，数据库继续验证外键、条件学号与唯一性，不能信任客户端提供的身份或活动要求。`recorded_by` 的生成类型虽然必填，但该列没有客户端 INSERT grant；payload 的单点类型断言只为兼容既有可信 trigger，并已用真实 SQL 证明不传该列的 INSERT 合法。没有手改生成类型或扩大列权限。

活动安全计数可由 Li 在活动页面组合：调用 `registrationService.count(event.id)` 后，将结果传给 `RegistrationCount`。名单入口使用 `/registrations/${event.id}`。仅允许 authorised 用户看名单入口；计数组件本身不是权限检查。

## 仍待接入：不能声称 #27 全部完成

1. Li / #17：真实活动入口与 Event read port 未交付；当前名单查询只复用已有 events 表验证活动存在，不实现活动 CRUD。正式接入时核对活动要求与 UI 导航合同。
2. Shiying / #26：参与者 create/match port 与身份表单未交付；当前没有自己新建参与者的替代流程。Yubo 仍需在自己负责的路由组合两位提供者的结果及 `RegistrationCreateForm`，完成首次参与者登记的真实端到端验证。
3. 既有根路径 `/registrations` 位于 `(auth)`，仍是基础演示页。没有再创建相同 URL 的 `(dashboard)/registrations/page.tsx`，也没有擅自修改共享认证页面；由 Joshua 确认入口文件交接后，Yubo 补齐入口组合。
4. 所有者需复查最终接口，不应把本地 fixture 的字段名误认为团队已冻结的公共接口。当前创建流程属于独立消费者实现，不是全链路上线。
5. 既有会议历史页 `src/app/(dashboard)/meetings/(history)/page.tsx:19` 的默认参数类型包含 undefined，导致生成 PageProps 检查失败。干净基线已复现；Joshua 协调原所有者修复，不混入 #27。
6. #28 尚未开始。成员计划明确要求 #27 先进入 Testing，再推进报名/签到分离专项验证；#27 的个人自查和 Draft 不等于非作者批准。

阻断记录：首次确认 2026-09-08 23:05 Australia/Sydney。Yubo 负责跟进 #17/#26 接入，Joshua 负责接口/入口所有权和构建阻断协调；下次检查 2026-09-09 23:05。这里只记录交接时间，未设置自动提醒或发送团队消息。

## 验证证据

运行环境：Node.js 24.19.0、现有 lockfile 依赖，无新增包。所有测试使用虚构人员和 `.test` 邮箱。

| 检查 | 命令/方式 | 结果 |
|---|---|---|
| 功能测试 | `node node_modules/vitest/vitest.mjs run src/features/registrations "src/app/(dashboard)/registrations" tests/integration/registrations` | 5 文件、57 项通过，覆盖服务端授权、输入、SDK 请求与投影、页面拒绝、UI 状态和刷新边界 |
| 全量测试 | `npm test` | 66 文件、385 项通过；5 项脚本测试通过 |
| 验收回归 | `npm run test:acceptance` | 21 文件、148 项通过，不替代尚未接入的真实身份流程 |
| Lint | `npm run lint` | 通过 |
| Typecheck | `npm run typecheck` | 生产构建前通过；生产构建后受既有会议历史页生成类型错误阻断 |
| 构建 | `node node_modules/next/dist/bin/next build --webpack` | 编译成功；后续被既有会议历史页 PageProps 类型错误阻断 |
| 真实数据库 | 本基线全部 timestamp migrations 在无对外端口的独立 Supabase PostgreSQL 容器重放，再执行 `supabase/tests/constraints/issue-27-registration-management.sql` | 20 项 pgTAP 断言通过；最后 rollback，不写远程库 |
| 并发 | `node tests/integration/registrations/records/database-concurrency.mjs mahjongflow-issue27-db` | 两连接重复登记只留一行；旧版本恢复不能覆盖取消；临时 fixture 清理成功 |
| 浏览器 | Playwright + 已安装 Chrome，真实 Client Components + 虚构 port | 1280×900、320×900：登记→重复→取消→重复仍取消→恢复；失败恢复、冲突不改计数、键盘、长文本换行通过；无控制台错误 |

PostgreSQL 测试使用现有 `public.ecr.aws/supabase/postgres:17.6.1.156` 镜像的独立 `mahjongflow-issue27-db` 容器，`--network none` 且不开放端口；未启动/重置其他容器。SQL 同时设置旧式单独 JWT claims 与 JSON claims，以兼容该镜像初始 auth helper 和完整 Supabase 环境，不改变 helper 或 policy。

SDK 契约测试使用真实 supabase-js 客户端、模拟 HTTP 响应；真实 SQL 和并发测试另行验证数据库。浏览器地址 `http://127.0.0.1:4327` 是临时测试程序，不是生产 App 的受保护页面。截图见[桌面](evidence/desktop.png)、[窄屏](evidence/mobile.png)。尚未验证真实 #17/#26 到本功能的整个流程。

## 数据库、隐私和回退

当前 migrations 已具备报名表、event/participant 唯一键、状态 enum、身份外键、条件学号检查、索引、RLS、可信审计 trigger 和安全聚合 RPC。为避免按旧 Issue 字样重复建表，本次不新增 schema 或 policy，也不新增无作用 migration。生成类型、seed、共享迁移运维文档未改，不占用 Li/Joshua 的文件。

不提供删除、公开自助报名、额外个人字段、外部通知或签到操作。取消保留原记录；恢复复用原记录。回退功能提交即可撤下新增动态路由和操作，不需要数据库回滚；已经产生的报名记录仍按原 schema 保留。补齐 provider、入口组合、真实验收和非作者审查之前保持 Draft，不合并或关闭 Issue。

实现参考：[Supabase update/filter/select](https://supabase.com/docs/reference/javascript/update)，以及当前安装版本 Next.js 的 Server Functions、Server/Client Components、revalidatePath 文档。会话未提供 Context7 工具，使用安装文档及官方主来源核对 API。
# 2026-09-10 接入更新

在用户接手 Sprint 6 测试与合并后，已接入 #17 的真实活动查询和 #26 的身份 port／字段组件。`/registrations` 选择活动后进入授权名单与登记表单；服务端重新获取活动的学生证要求，仅使用服务端解析的参与者 ID 登记。浏览器伪造 participantId 或 requiresStudentId 不参与决策。

新增组合测试覆盖身份规范化、服务端活动要求、委员会拒绝、活动不存在及已取消重复报名。身份匹配成功但登记暂时失败时，保留可复用身份，重试仍受唯一约束保护；不会声称报名成功。以下历史独立交付记录中的“未接入”状态由本节替代，历史测试结果不代表本次接入测试。
