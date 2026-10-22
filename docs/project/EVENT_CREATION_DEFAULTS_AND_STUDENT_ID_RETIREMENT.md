# 活动创建默认值与学号要求停用

## 已确认决定

2026-10-21，Joshua 要求创建活动时，日期时间默认使用打开页面时的悉尼当前时间（分钟精度），Type 默认 `weekly_session`，Status 默认 `scheduled`，并移除 `Require student ID for registration` 功能。保持原有视觉风格；编辑已有活动仍保留原有日期、类型与状态，表单校验失败不会重置用户输入。

## 实现与兼容性

- 创建页在请求时生成当前时间，使用 `Australia/Sydney` 格式填入原生日期时间控件；由用户自行调整。
- 创建／编辑页移除学号要求复选框，详情页移除学号要求说明，提交解析与服务端验证均将兼容字段固定为 `false`。
- `20261021070319_retire_event_student_id_requirement.sql` 关闭已有活动的要求，并通过 CHECK 约束阻止重新启用。
- 保留 `requires_student_id` 列、旧 DTO／RPC 形状及旧触发器作为回退兼容结构。活动要求始终为 false，因此内部报名和公开 QR 流程不再要求学号。
- 不删除既有参与者学号或修改身份唯一约束；数据保留／清理属于独立决定。不更改 RLS、函数授权、身份匹配或参与者明细的读取边界，不新增外键、索引或公开字段。

## 部署与回退

1. 先备份需要恢复的活动配置，再按时间顺序应用上述 migration；本地使用 `supabase migration up --local`，禁止 reset 现有工作数据库。
2. 重新生成 `src/types/database.generated.ts`，运行活动／报名测试、数据库权限与并发测试、类型检查、lint 和构建，再发布前端。
3. 虚构 seed 的活动要求均改为 false。migration 不删除报名、签到、晚餐或参与者记录。
4. 回退需先用新的前向 migration 删除 `events_student_id_requirement_retired` 约束，再恢复旧前端。历史 true 配置只从部署前备份逐项恢复，不能从现存参与者学号推测。
5. 旧 schema／RLS 回归测试仅在可回滚测试事务内暂时撤下新约束，以验证保留的旧触发器回退兼容性；新停用合同由 `supabase/tests/events/student_id_retirement.sql` 覆盖。并发测试验证两个无学号报名均成功且不同连接不能重新开启要求。

## 验证范围

- 悉尼跨日、冬令时与夏令时切换的默认值；编辑保留原值；伪造旧表单字段不能启用要求。
- committee 可维护活动及提交无学号报名，但不能读取参与者明细；authorised 保留原有允许访问；匿名创建／修改活动仍被拒绝。
- 浏览器检查默认字段、可修改性、必填错误和学号开关消失；不在真实活动上提交测试报名。

关联范围：[MVP 项目企划书](MVP_PROJECT_PROPOSAL.md) 中的活动准备与报名流程。
