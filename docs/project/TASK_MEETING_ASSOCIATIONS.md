# Task 与 Meeting 的多对多关联

2026-10-15 用户确认：创建或编辑 Task 时可选择多场 Meeting，同一场 Meeting 也可关联多个 Task。该决定替代只允许从 Meeting 决策／讨论点建立关联的界面限制，不改变角色权限。

- `task_meetings` 保存多对多关联，主键为 `(task_id, meeting_id)`；反向索引支持会议详情查询，外键保证两端记录有效。
- Task 创建与编辑页提供会议多选；任务详情显示所有关联会议及跳转链接。会议详情展示关联任务，区分原始决策／讨论点与普通关联。
- `tasks.source_meeting_id`、`source_decision_id`、`source_discussion_point_id` 继续保存不可修改的原始来源。它们不是完整的会议关联列表。普通关联不会伪造决策来源。
- 历史来源关系在 migration 中回填；此后从会议转换创建的任务由触发器自动补充关联。原始来源会议始终关联，其他会议可增减；无来源任务可取消全部关联。
- 任务内容与关联列表通过调用者权限的 `save_task_with_meetings` RPC 在同一事务中保存。任一无效会议会回滚整个操作；沿用会议删除与任务来源的 advisory lock，避免删除和关联竞争。
- 活跃 `committee` 和 `authorised` 可读写关联，匿名和停用用户被数据库权限／RLS 拒绝。RPC 更新不接收来源或作者变更。
- 删除任务级联清理关联；仍被任务关联的会议不能删除，返回既有 `linked_tasks` 状态。新增、修改、完成、删除任务会刷新会议页面，包括已经取消关联的会议。

## 部署与已有数据

先应用 `20261015022518_add_task_meeting_links.sql`，再生成数据库类型并发布新前端。本次只更新本地现有数据库，不重置数据，不修改远程环境。旧来源列和会议转换行为保留。

通常回退只需恢复旧前端，保留新增表和来源同步触发器；旧代码仍能运行。若必须移除 schema，先备份新增的关联映射，再停止新版本写入，恢复 `20260821060847_add_meeting_delete_boundary.sql` 中的删除函数，删除新 RPC、两个新触发器及其函数，最后删除 `task_meetings` 并重新生成类型。完整 schema 回退会失去新增的额外关联，因此默认采用保留 schema 的应用回退。

## 验证

真实本地数据库测试覆盖多对多双向读取、取消关联、来源回填与保护、保存失败回滚、唯一性、受保护删除、匿名／停用用户拒绝以及并发保存。运行方式：在本地设置 `TASK_MEETINGS_LIVE_DATABASE=1` 后执行 `vitest run src/features/tasks/core/meeting-links.database.test.ts`。测试只创建虚构数据及临时账号，并在结束时清理自己的记录。
