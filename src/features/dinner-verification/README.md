# 内部晚餐名册与签到邮箱核验

2026-10-16 用户确认：晚餐核验页只显示同活动有效报名、已确认签到并通过内部名册邮箱匹配的人员。决定、独立 Issue／PR、迁移、回退和验收见[签到邮箱匹配](../../../docs/project/DINNER_CHECK_IN_EMAIL_MATCHING.md)。历史 evidence 仅代表原日期实现。

## 入口与规则

活动详情 → Verify dinner eligibility → 晚餐核验页。具备 authorised 与管理员能力的人员看到 Manage dinner roster，可提前预录、恢复和移除内部成员；未签到成员仍保留在管理列表。授权非管理员只看到通过匹配的核验结果，普通委员和匿名不能读取明细。

`roster.ts` 保留内部名册维护，`matched-attendance.ts` 通过用户 JWT 调用只读、SECURITY INVOKER 的 `list_matched_dinner_attendees` RPC，所有关联表继续执行既有 RLS。`server.ts` 的两个公开读取入口只消费匹配结果。核验 DTO 中 participantId 为实际参与者 ID；管理列表中的 participantId 保留内部名册记录 ID，两者不得互换。

邮箱在报名与名册写入边界转小写并去首尾空格；SQL 再次标准化参与者邮箱。每个活动单独匹配，姓名不参与匹配。撤销签到、取消报名和移除名册成员会在刷新时排除；没有复制的资格状态。公开报名不自动签到、不自动加入内部名册。

名单最小 DTO 不暴露学号、录入者或 Auth 资料。刷新逻辑保留旧值／过期提示、最新请求优先及失败时禁止依赖陈旧结果的约定。

## 验证

`database.test.ts` 为真实本地 opt-in 测试，设置 ISSUE35_LIVE_DATABASE=1，使用忽略的 .env.local 中的本地连接，仅创建并清理随机虚构资料。覆盖公开报名、邮箱标准化、签到前后变化、撤销／恢复、取消报名和名册移除／恢复以及权限边界。SQL 回归位于 `supabase/tests/rls/dinner_check_in_matching.sql`。

单元测试覆盖匹配读端口的权限、失败和分页、名单投影与刷新、管理员原始名册与核验结果分离。浏览器本次验收截图为 evidence 下 dinner-email-match 两张图片，其余历史脚本／截图不证明本版行为。
