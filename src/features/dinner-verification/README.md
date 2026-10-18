# 通用晚餐资格与活动发放

当前规则、迁移、回退和验收以[2026-10-18 决定](../../../docs/project/DINNER_CHECK_IN_EMAIL_MATCHING.md)为准。

`/dinner-roster` 是独立的通用资格录入页面，无活动参数；管理员录入一次，持续用于所有活动。`roster.ts` 维护通用表，不消耗资格。原活动名册数据只保留历史，活跃邮箱由迁移去重转入通用表。

`/dinner-verification/[eventId]` 是本场可领取与已发放列表。`matched-attendance.ts` 通过真实会话读取 SECURITY INVOKER 函数，合并当前报名／确认签到／通用资格与本场发放记录。`server.ts` 投影最小 DTO，不泄漏学号、操作者或 Auth 信息。撤销签到后已发放记录仍可见，避免丢失已服务事实。

`issuance.ts` 和 `issuance-action.ts` 执行 authorised 鉴权、输入校验及安全错误映射。原子写函数检查活跃身份，锁定当前活动和首次发放的资格事实，同活动同人联合主键保证幂等。发放时间／操作者由数据库生成；浏览器勾选在服务器确认和刷新成功后显示，失败不假报成功。清除误勾需要确认，修改审计保留。

刷新期间禁用发放操作，过期／失败结果明确提示，权限丢失清空身份；请求序号防止旧结果覆盖新结果。资格管理仅管理员，授权工作人员可以记录活动发放，普通委员／匿名／停用用户拒绝。

`database.test.ts` 使用 ISSUE35_LIVE_DATABASE=1 运行真实本地回归，包括重复并发发放。`supabase/tests/rls/dinner_check_in_matching.sql` 覆盖通用资格跨活动、已发放保留、明确更正、权限和不允许直接表写入。evidence 下 dinner-global 三张截图为当前版本，其余旧截图按原日期理解。
