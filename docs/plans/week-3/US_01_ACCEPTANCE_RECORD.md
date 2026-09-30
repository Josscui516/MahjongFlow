# US-01 会议管理验收记录

> 复核日期：2026-08-27（Australia/Sydney）
> 复核分支：`sprint/4-decision-to-task`
> 数据：固定虚构会议、成员、讨论点、决策与任务

## 1. 结论

会议管理的当前技术实现通过回归验收：后台用户可以创建、读取、更新、浏览和永久删除会议；议程讨论点与关键决策保持有序；匿名与无后台 profile 的访问在服务端和 RLS 层拒绝。永久删除已按最新范围决定保留，必须二次确认，并在会议存在来源追踪任务时拒绝。

历史 Sprint 3 的非作者 review 与 Project Acceptance Gate 证据仍不完整，不能在本记录中事后补签；技术通过不等于历史流程门禁自动通过。

## 2. M-01 至 M-06

| 场景 | 当前证据 | 结果 |
|---|---|---|
| M-01 创建与更新会议 | service、route、atomic RPC 与数据库重读测试 | 通过 |
| M-02 校验与原子性 | 空标题、无参会者、失效成员、失败回滚 | 通过 |
| M-03 议程记录 | 讨论点和关键决策有序保存与更新 | 通过 |
| M-04 历史发现与重开 | 搜索、时间过滤、排序、分页和详情链接 | 通过 |
| M-05 权限拒绝 | 匿名、无 profile、角色与 RLS 正反向断言 | 通过 |
| M-06 UI 状态与可访问性 | loading／empty／success／error、桌面与窄屏 Chrome DOM／视觉复核 | 通过 |

## 3. 删除能力的范围与安全合同

- UI 使用显式“Delete”按钮和 `Delete meeting?` 对话框，展示资源范围与不可撤销警告；
- 写操作只通过 `deleteMeetingAction` → service → `delete_meeting_record(uuid)`；
- RPC 要求有效后台身份，匿名无执行权限；
- 已有关联来源任务时返回 `linked_tasks`，会议和追踪关系保持不变；
- migration 与回滚说明见 `supabase/migrations/20260821060847_add_meeting_delete_boundary.sql` 和 `docs/operations/DATABASE_MIGRATIONS.md`。

## 4. 复验结果

- `npm test`：60 个文件、324 项通过；
- `npm run test:acceptance`：21 个文件、148 项通过；
- `npm run db:test`：7 个 SQL 文件、261 项断言通过，其中会议持久化 31 项；
- `npm run db:test:concurrency`：18 项约束并发与 9 项 RLS／状态交换断言通过；
- `npm run db:lint`：无 schema 错误；
- `npm run db:diff`：`No schema changes found`；
- `npm run lint`、`npm run typecheck`、`npm run build`：通过；
- Chrome：会议历史可见删除入口，点击后出现二次确认；Dashboard、任务和来源返回链接均可达。

## 5. 仍需人工处理

1. Joshua 核对 Sprint 3 Project Acceptance Gate，并决定是否接受历史 review 证据缺失；
2. 不得把本次 Codex 复核当作团队非作者批准；
3. 后续若改变删除、归档或任务来源保留策略，必须先同步 MVP 提案、migration 合同和验收测试。

## 6. 历史 Gate 人工复核（2026-09-30）

Joshua 在本轮逐项确认 #2／#12／#13／#14／#56 全部验收通过。已核对 Sprint 3 总 PR #60 的 main 合并、五项 Quality 成功及会议工程验收记录，同步这五项 checkbox 与 Project Gate 为 Passed；Done／closed 保留。本节替代第 5 节的待人工确认状态，不补造旧 review 事件，也不声称今天重跑了第 4 节测试。#65 的后续删除范围协调仍保持 open。
